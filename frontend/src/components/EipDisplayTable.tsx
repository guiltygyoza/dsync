import { useState, useMemo, useContext, useEffect, useRef, useCallback } from "react";
import { EIP_CATEGORY, EIP_STATUS, AllEIPCategoryValues, AllEIPStatusValues, type ICoreEIPInfo } from "@dsync/types";
import "../EipDisplayTable.css";
import { useNavigate, useLocation } from "react-router-dom";
import { HeliaContext, DBFINDER_ADDRESS } from "../provider/HeliaProvider";

// Define interfaces based on usage to replace 'any' types for dbFinder and event entry
interface MinimalStoreInterface {
	iterator(options?: { amount?: number }): AsyncIterableIterator<{ value: string }>;
	events: {
		on(eventName: string, callback: (entry: StoreEventEntry) => void): void;
		off(eventName: string, callback?: (entry: StoreEventEntry) => void): void;
	};
	close(): Promise<void> | void;
}

interface StoreEventEntry {
	payload: {
		value: string; // Expecting JSON string of ICoreEIPInfo
	};
}

type GroupedEIPs = Map<EIP_CATEGORY, Map<EIP_STATUS, ICoreEIPInfo[]>>;

const EipDisplayTable: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { readOrbitDB: orbitDB } = useContext(HeliaContext);

	const [dbEips, setDbEips] = useState<ICoreEIPInfo[]>([]);
	const [isLoadingEips, setIsLoadingEips] = useState<boolean>(true);
	const [dbError, setDbError] = useState<string | null>(null);

	const dbFinderRef = useRef<MinimalStoreInterface | null>(null);

	const [expandedSections, setExpandedSections] = useState<Map<string, boolean>>(new Map());
	const [selectedCategory, setSelectedCategory] = useState<EIP_CATEGORY | "All">("All");

	const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			setIsSmallScreen(window.innerWidth < 768);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const hash = location.hash.replace("#", "").toLowerCase();

		const categoryFromHash = AllEIPCategoryValues.find((cat) => cat.toLowerCase() === hash);
		if (categoryFromHash) {
			setSelectedCategory(categoryFromHash);
		} else {
			setSelectedCategory("All"); // Default to 'All' for any other hash or no hash
		}

		if (isSmallScreen) {
			setIsDropdownOpen(false); // Close dropdown on selection
		}

		// After state update, scroll to the relevant section.
		// Use a short timeout to allow the DOM to update.
		setTimeout(() => {
			const elementId = hash && hash.length > 0 ? hash : "all";
			const element = document.getElementById(elementId);
			if (element && elementId !== "all") {
				element.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}, 100);
	}, [location, isSmallScreen]);

	// Stable event handler for database updates
	const updateHandler = useCallback((entry: StoreEventEntry) => {
		console.log("DB update event received:", entry);
		const newEip = JSON.parse(entry.payload.value) as ICoreEIPInfo;
		setDbEips((prevEips) => {
			if (!prevEips.find((existingEip) => existingEip._id === newEip._id)) {
				return [...prevEips, newEip];
			}
			return prevEips;
		});
	}, []);

	useEffect(() => {
		let isMounted = true;

		const openAndLoadDatabase = async () => {
			if (!orbitDB) {
				if (isMounted) setIsLoadingEips(false);
				return;
			}

			// Only open if the ref is null (i.e., DB not opened by this component instance yet or was cleaned up)
			if (!dbFinderRef.current) {
				try {
					if (isMounted) {
						setIsLoadingEips(true);
						setDbError(null);
					}
					console.log(`Opening the DBFinder at: ${DBFINDER_ADDRESS}`);
					const newDbFinder = await orbitDB.open(DBFINDER_ADDRESS, { type: "keyvalue" });

					if (!isMounted) {
						// Component unmounted while opening
						if (newDbFinder) newDbFinder.close();
						return;
					}
					dbFinderRef.current = newDbFinder;

					// Ensure dbFinderRef.current is not null before proceeding
					if (!dbFinderRef.current) {
						console.error("Failed to initialize dbFinderRef.current after open.");
						if (isMounted) {
							setDbError("Failed to initialize database instance.");
							setIsLoadingEips(false);
						}
						return;
					}

					// Attach event listener for updates
					dbFinderRef.current.events.on("update", updateHandler);

					// Load initial EIPs
					console.log("Fetching EIPs from DB...");
					const initialEips: ICoreEIPInfo[] = [];
					for await (const record of dbFinderRef.current.iterator()) {
						const eip = JSON.parse(record.value) as ICoreEIPInfo;
						initialEips.push(eip);
					}
					if (isMounted) {
						console.log("Fetched EIPs from DB:", initialEips.length);
						setDbEips(initialEips);
					}
				} catch (error) {
					console.error("Error loading EIPs from OrbitDB:", error);
					if (isMounted) {
						setDbError(error instanceof Error ? error.message : "Unknown error loading EIPs");
					}
				} finally {
					if (isMounted) {
						setIsLoadingEips(false);
					}
				}
			}
		};

		openAndLoadDatabase();

		return () => {
			isMounted = false;
			if (dbFinderRef.current) {
				console.log("Cleaning up EIP database listener and closing connection:", DBFINDER_ADDRESS);
				dbFinderRef.current.close();
				dbFinderRef.current = null;
			}
		};
	}, [orbitDB, updateHandler]);

	const { groupedEIPs } = useMemo(() => {
		const newGroupedEIPs: GroupedEIPs = new Map();

		for (const category of AllEIPCategoryValues) {
			const statusMap = new Map<EIP_STATUS, ICoreEIPInfo[]>();
			for (const status of AllEIPStatusValues) {
				statusMap.set(status, []);
			}
			newGroupedEIPs.set(category, statusMap);
		}

		for (const eip of dbEips) {
			newGroupedEIPs.get(eip.category)?.get(eip.status)?.push(eip);
		}

		for (const statusMap of newGroupedEIPs.values()) {
			for (const eipList of statusMap.values()) {
				eipList.sort((a, b) => b._id - a._id);
			}
		}
		return {
			groupedEIPs: newGroupedEIPs,
		};
	}, [dbEips]);

	const handleEipClick = (eip: ICoreEIPInfo) => {
		console.log("eip passed to handleEipClick", eip);
		navigate(`/eips/${eip._id}`, { state: { dbAddress: eip.dbAddress } });
	};

	const toggleSection = (category: EIP_CATEGORY, status: EIP_STATUS) => {
		const key = `${category}-${status}`;
		const newExpandedSections = new Map(expandedSections);
		newExpandedSections.set(key, !newExpandedSections.get(key));
		setExpandedSections(newExpandedSections);
	};

	const isExpanded = (category: EIP_CATEGORY, status: EIP_STATUS): boolean => {
		return !!expandedSections.get(`${category}-${status}`);
	};

	const navCategories: (EIP_CATEGORY | "All")[] = ["All", ...AllEIPCategoryValues];

	return (
		<div>
			<nav className="category-header-nav">
				{isSmallScreen ? (
					<div className="dropdown">
						<button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="dropdown-toggle">
							{selectedCategory} <span className="arrow">{isDropdownOpen ? "▲" : "▼"}</span>
						</button>
						{isDropdownOpen && (
							<div className="dropdown-menu">
								{navCategories.map((category) => (
									<a
										key={category}
										href={category === "All" ? "#all" : `#${category.toLowerCase()}`}
										className={selectedCategory === category ? "active" : ""}
									>
										{category}
									</a>
								))}
							</div>
						)}
					</div>
				) : (
					navCategories.map((category) => (
						<a
							key={category}
							href={category === "All" ? "#all" : `#${category.toLowerCase()}`}
							className={selectedCategory === category ? "active" : ""}
						>
							{category}
						</a>
					))
				)}
			</nav>
			{isLoadingEips && (
				<div className="loading-indicator">
					<p>Loading EIPs from database...</p>
					<div className="spinner"></div>
				</div>
			)}
			{dbError && <p style={{ color: "red" }}>{dbError}</p>}
			{!isLoadingEips && !dbError && dbEips.length === 0 && <p>No EIPs found in the database.</p>}
			<div id="eip-listing-section">
				{" "}
				{/* Added an ID for scrolling */}
				{Array.from(groupedEIPs.entries())
					.filter(([category]) => selectedCategory === "All" || category === selectedCategory)
					.map(([category, statusMap]) => {
						const eipsInCategory = Array.from(statusMap.values()).flat();
						if (eipsInCategory.length === 0) return null;

						return (
							<section key={category} id={category.toLowerCase()} className="category-section">
								<h2 className="category-title">
									{category} ({eipsInCategory.length})
								</h2>
								{Array.from(statusMap.entries()).map(([status, eipList]) => {
									if (eipList.length === 0) return null;
									const expanded = isExpanded(category, status);
									return (
										<div key={status} className="status-group">
											<details open={expanded}>
												<summary
													onClick={(e) => {
														e.preventDefault();
														toggleSection(category, status);
													}}
												>
													{status} ({eipList.length})
												</summary>
												<table className="eip-table">
													<thead>
														<tr>
															<th className="eip-number">Number</th>
															<th className="eip-title">Title</th>
															{/* <th className="eip-author">Author</th> */}
														</tr>
													</thead>
													<tbody>
														{eipList.map((eip) => (
															<tr
																key={eip._id}
																onClick={() => handleEipClick(eip)}
																style={{ cursor: "pointer" }}
															>
																<td className="eip-number">
																	<a
																		target="_blank"
																		rel="noopener noreferrer"
																		onClick={() => handleEipClick(eip)}
																	>
																		{eip._id}
																	</a>
																</td>
																<td className="eip-title">{eip.title}</td>
																{/* <td className="eip-author">{eip.author}</td> */}
															</tr>
														))}
													</tbody>
												</table>
											</details>
										</div>
									);
								})}
							</section>
						);
					})}
			</div>
		</div>
	);
};

export default EipDisplayTable;
