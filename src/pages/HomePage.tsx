import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { placeholderEIPs } from "../placeholderData";
import type { EIP } from "../types/eip";
import { EIP_STATUS, EIP_CATEGORY, AllEIPCategoryValues } from "../constants/eip";

// Define EIPCategory structure locally or in a UI types file if preferred
interface EIPCategoryDisplay {
	name: EIP_CATEGORY;
	eips: EIP[];
}

const HomePage: React.FC = () => {
	const [categorizedEIPs, setCategorizedEIPs] = useState<EIPCategoryDisplay[]>([]);

	useEffect(() => {
		// In a real app, you would fetch EIPs from an API
		const eips = placeholderEIPs;

		// Dynamically create categories from EIPs
		const categoriesMap = new Map<EIP_CATEGORY, EIP[]>();

		AllEIPCategoryValues.forEach((categoryValue) => {
			categoriesMap.set(categoryValue, []);
		});

		eips.forEach((eip) => {
			const categoryEIPs = categoriesMap.get(eip.category);
			if (categoryEIPs) {
				categoryEIPs.push(eip);
			} else {
				// This case should ideally not happen if AllEIPCategoryValues is comprehensive
				// or if EIP categories are strictly validated against EIP_CATEGORY enum.
				// For robustness, one might create a new category entry here or log an error.
				console.warn(`EIP with id ${eip.id} has an unknown category: ${eip.category}`);
				// categoriesMap.set(eip.category as EIP_CATEGORY, [eip]); // If allowing dynamic categories not in enum
			}
		});

		const sortedCategories: EIPCategoryDisplay[] = Array.from(categoriesMap.entries())
			.map(([name, eipsList]) => ({ name, eips: eipsList }))
			.filter((category) => category.eips.length > 0) // Optionally hide empty categories
			.sort((a, b) => a.name.localeCompare(b.name)); // Sort categories by name

		setCategorizedEIPs(sortedCategories);
	}, []);

	const isChamberEditable = (status: EIP_STATUS): boolean => {
		return [EIP_STATUS.DRAFT, EIP_STATUS.REVIEW, EIP_STATUS.LAST_CALL].includes(status);
	};

	return (
		<div>
			<h1>Ethereum Improvement Proposals</h1>
			{categorizedEIPs.length === 0 ? (
				<p>Loading EIPs or no EIPs available...</p>
			) : (
				categorizedEIPs.map((category) => (
					<div key={category.name} style={{ marginBottom: "20px" }}>
						<h2>{category.name}</h2>
						{category.eips.length === 0 ? (
							<p>No EIPs in this category yet.</p>
						) : (
							<ul style={{ listStyle: "none", padding: 0 }}>
								{category.eips.map((eip) => (
									<li
										key={eip.id}
										style={{
											marginBottom: "10px",
											padding: "10px",
											border: "1px solid #ccc",
											borderRadius: "4px",
										}}
									>
										<Link
											to={`/chamber/${eip.chamberId}`}
											style={{ textDecoration: "none", color: "inherit" }}
										>
											<h3>
												{eip.title} (Status: {eip.status})
											</h3>
											<p>Author: {eip.author}</p>
											<p>
												Chamber is: {isChamberEditable(eip.status) ? "Editable" : "Read-only"}
											</p>
										</Link>
									</li>
								))}
							</ul>
						)}
					</div>
				))
			)}
		</div>
	);
};

export default HomePage;
