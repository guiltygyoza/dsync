export interface IComment {
	id: string;
	eipId: number;
	text: string;
	createdBy: string;
	createdAt: number;
	parentId: string | null;
}
