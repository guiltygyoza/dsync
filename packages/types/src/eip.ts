export enum EIP_STATUS {
	DRAFT = "Draft",
	REVIEW = "Review",
	LAST_CALL = "Last Call",
	FINAL = "Final",
	STAGNANT = "Stagnant",
	WITHDRAWN = "Withdrawn",
	LIVING = "Living",
}

export enum EIP_CATEGORY {
	CORE = "Core",
	NETWORKING = "Networking",
	INTERFACE = "Interface",
	ERC = "ERC",
	META = "Meta",
	INFORMATIONAL = "Informational",
}

// Helper function to get all EIP_STATUS values
export const AllEIPStatusValues = Object.values(EIP_STATUS);

// Helper function to get all EIP_CATEGORY values
export const AllEIPCategoryValues = Object.values(EIP_CATEGORY);

export interface IEIP {
	id: number;
	title: string;
	description: string;
	content: string; // Markdown
	status: EIP_STATUS;
	category: EIP_CATEGORY;
	author: string;
	createdAt: Date;
	updatedAt: Date;
	requires: number[] | null;
}
