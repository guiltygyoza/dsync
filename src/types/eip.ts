import { EIP_STATUS, EIP_CATEGORY } from "../constants/eip";

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
