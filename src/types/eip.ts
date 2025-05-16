import { EIP_STATUS, EIP_CATEGORY } from "../constants/eip";

export interface EIP {
	id: number;
	title: string;
	status: EIP_STATUS;
	category: EIP_CATEGORY;
	author: string;
	createdAt: Date;
	updatedAt: Date;
	requires: number[] | null;
	chamberId: string;
}
