export interface IComment {
	id: string;
	eipId: number;
	content: string;
	createdBy: string;
	createdAt: Date;
	parentId: string | null;
}
