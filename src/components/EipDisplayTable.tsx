import React, { useState, useMemo } from "react";
import { placeholderEIPs } from "../placeholderData";
import type { IEIP } from "../types/eip";
import type { IComment } from "../types/comment";
import { EIP_CATEGORY, EIP_STATUS, AllEIPCategoryValues, AllEIPStatusValues } from "../constants/eip";
import EipDetailView from "./EipDetailView";
import "../EipDisplayTable.css";
import { useNavigate } from "react-router-dom";

const allEips: IEIP[] = placeholderEIPs;

type GroupedEIPs = Map<EIP_CATEGORY, Map<EIP_STATUS, IEIP[]>>;

const EipDisplayTable: React.FC = () => {
	const navigate = useNavigate();

	const [selectedEip, setSelectedEip] = useState<IEIP | null>(null);
	const [selectedComments, setSelectedComments] = useState<IComment[]>([]);
	const [expandedSections, setExpandedSections] = useState<Map<string, boolean>>(new Map());
	const [selectedCategory, setSelectedCategory] = useState<EIP_CATEGORY | "All">("All");

	const { groupedEIPs } = useMemo(() => {
		const newGroupedEIPs: GroupedEIPs = new Map();

		for (const category of AllEIPCategoryValues) {
			const statusMap = new Map<EIP_STATUS, IEIP[]>();
			for (const status of AllEIPStatusValues) {
				statusMap.set(status, []);
			}
			newGroupedEIPs.set(category, statusMap);
		}

		for (const eip of allEips) {
			newGroupedEIPs.get(eip.category)?.get(eip.status)?.push(eip);
		}

		for (const statusMap of newGroupedEIPs.values()) {
			for (const eipList of statusMap.values()) {
				eipList.sort((a, b) => b.id - a.id);
			}
		}
		return {
			groupedEIPs: newGroupedEIPs,
		};
	}, []);

	const handleEipClick = (eip: IEIP) => {
		navigate(`/eips/${eip.id}`);
	};

	const handleCloseDetailView = () => {
		setSelectedEip(null);
		setSelectedComments([]);
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
				{navCategories.map((category) => (
					<a
						key={category}
						href={`#${category.toLowerCase()}`}
						className={selectedCategory === category ? "active" : ""}
						onClick={(e) => {
							e.preventDefault(); // Prevent default anchor behavior
							setSelectedCategory(category);
							// Scroll to the top of the EIP display section or a relevant section
							const sectionElement = document.getElementById("eip-listing-section");
							if (sectionElement) {
								sectionElement.scrollIntoView({ behavior: "smooth" });
							}
						}}
					>
						{category}
					</a>
				))}
			</nav>
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
								<h2 className="category-title">{category}</h2>
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
													{status}
												</summary>
												<table className="eip-table">
													<thead>
														<tr>
															<th className="eip-number">Number</th>
															<th className="eip-title">Title</th>
															<th className="eip-author">Author</th>
														</tr>
													</thead>
													<tbody>
														{eipList.map((eip) => (
															<tr
																key={eip.id}
																onClick={() => handleEipClick(eip)}
																style={{ cursor: "pointer" }}
															>
																<td className="eip-number">
																	<a
																		href={`https://eips.ethereum.org/EIPS/eip-${eip.id}`}
																		target="_blank"
																		rel="noopener noreferrer"
																		onClick={(e) => e.stopPropagation()}
																	>
																		{eip.id}
																	</a>
																</td>
																<td className="eip-title">{eip.title}</td>
																<td className="eip-author">{eip.author}</td>
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
			{selectedEip && (
				<EipDetailView eip={selectedEip} comments={selectedComments} onClose={handleCloseDetailView} />
			)}
		</div>
	);
};

export default EipDisplayTable;
