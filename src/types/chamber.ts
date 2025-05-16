export interface Chamber {
	id: string;
	eipId: number;
	title: string;
	description: string;
	createdBy: string;
	createdAt: number;
}

export interface Comment {
	id: string;
	chamberId: string;
	text: string;
	createdBy: string;
	createdAt: number;
	parentId: string | null;
}
