export type Chamber = {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    createdAt: number;
};

export type Comment = {
    id: string;
    chamberId: string;
    text: string;
    createdBy: string;
    createdAt: number;
};
