export enum EIP_STATUS {
	LIVING = "Living",
	FINAL = "Final",
	LAST_CALL = "Last Call",
	REVIEW = "Review",
	DRAFT = "Draft",
	STAGNANT = "Stagnant",
	WITHDRAWN = "Withdrawn",
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

// Used to fetch EIP data from EIP document DB
export const SPECIAL_ID_FOR_EIP = "special-id-for-eip";

export interface IEIP {
	id: number;
	title: string;
	description: string;
	content: string; // Markdown
	status: EIP_STATUS;
	category: EIP_CATEGORY;
	authors: string[];
	createdAt: Date;
	updatedAt: Date;
	requires: number[];
	dbAddress: string;
	commentDBAddress: string;
}

export interface ICoreEIPInfo {
	id: number;
	title: string;
	status: EIP_STATUS;
	category: EIP_CATEGORY;
	dbAddress: string;
}
