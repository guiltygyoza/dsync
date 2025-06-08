export interface IComment {
	_id: string;
	eipId: number;
	content: string;
	createdBy: string;
	createdAt: Date;
	parentId: string | null;
}
