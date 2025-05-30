import { type IEIP, type IComment, AllEIPStatusValues, AllEIPCategoryValues } from "@dsync/types";

const randomTitles = [
	"title 1",
	"title 2",
	"title 3",
	"title 4",
	"title 5",
	"title 6",
	"title 7",
	"title 8",
	"title 9",
	"title 10",
];

const randomDescriptions = [
	"description 1",
	"description 2",
	"description 3",
	"description 4",
	"description 5",
	"description 6",
	"description 7",
	"description 8",
	"description 9",
	"description 10",
];

const randomContents = [
	"# content 1",
	"# content 2",
	"# content 3",
	"# content 4",
	"# content 5",
	"# content 6",
	"# content 7",
	"# content 8",
	"# content 9",
	"# content 10",
];

const randomAuthors = [
	"author 1",
	"author 2",
	"author 3",
	"author 4",
	"author 5",
	"author 6",
	"author 7",
	"author 8",
	"author 9",
	"author 10",
];

const numEIPs = 1000;
export const placeholderEIPs: IEIP[] = [];

for (let i = 1; i < numEIPs; i++) {
	placeholderEIPs.push({
		id: i,
		title: randomTitles[i % randomTitles.length],
		description: randomDescriptions[i % randomDescriptions.length],
		content: randomContents[i % randomContents.length],
		status: AllEIPStatusValues[i % AllEIPStatusValues.length],
		category: AllEIPCategoryValues[i % AllEIPCategoryValues.length],
		authors: (() => {
			const numAuthors = Math.floor(Math.random() * 3) + 1;
			const authors = [];
			for (let j = 0; j < numAuthors; j++) {
				authors.push(randomAuthors[Math.floor(Math.random() * randomAuthors.length)]);
			}
			return authors;
		})(),
		createdAt: new Date(Date.now() - i * 1000),
		updatedAt: new Date(Date.now() - i * 1000),
		requires: (() => {
			const numRequires = i % 10 === 0 ? Math.floor(Math.random() * 3) + 1 : 0;
			const requires = [];
			for (let j = 0; j < numRequires; j++) {
				requires.push(Math.floor(Math.random() * numEIPs) + 1);
			}
			return requires;
		})(),
	});
}

export const placeholderComments: IComment[] = [
	{
		id: "comment-1",
		eipId: 1,
		text: "This is a great proposal for EIP-1!",
		createdBy: "UserA",
		createdAt: Date.now() - 5000000,
		parentId: null,
	},
	{
		id: "reply-1-1",
		eipId: 1,
		text: "I agree with UserA!",
		createdBy: "UserB",
		createdAt: Date.now() - 4000000,
		parentId: "comment-1",
	},
	{
		id: "comment-2",
		eipId: 1,
		text: "I have some concerns about section 2 of EIP-1.",
		createdBy: "UserC",
		createdAt: Date.now() - 3000000,
		parentId: null,
	},
	{
		id: "comment-3",
		eipId: 2,
		text: "Looking forward to the review of EIP-2.",
		createdBy: "UserD",
		createdAt: Date.now() - 2000000,
		parentId: null,
	},
	{
		id: "comment-4",
		eipId: 2,
		text: "I have some concerns about section 2 of EIP-2.",
		createdBy: "UserE",
		createdAt: Date.now() - 1000000,
		parentId: null,
	},
	{
		id: "comment-5",
		eipId: 2,
		text: "I have some concerns about section 2 of EIP-2.",
		createdBy: "UserE",
		createdAt: Date.now() - 1000000,
		parentId: null,
	},
];
