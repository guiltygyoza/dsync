// File containing functions related to OrbitDB
import { SPECIAL_ID_FOR_EIP, type ICoreEIPInfo, type IEIP, type EIP_STATUS } from "@dsync/types";
// @ts-expect-error - OrbitDB is not typed
import { IPFSAccessController } from "@orbitdb/core";

const coreInfoFromEIP = (eip: IEIP): ICoreEIPInfo => {
	return {
		id: eip.id,
		title: eip.title,
		status: eip.status,
		category: eip.category,
		dbAddress: eip.dbAddress,
	};
};

const eipDocFromEIP = (eip: IEIP) => {
	return {
		_id: SPECIAL_ID_FOR_EIP,
		title: eip.title,
		description: eip.description,
		content: eip.content,
		status: eip.status,
		category: eip.category,
		authors: eip.authors,
		createdAt: eip.createdAt.toISOString(),
		updatedAt: eip.updatedAt.toISOString(),
		requires: eip.requires,
		dbAddress: eip.dbAddress,
		commentDBAddress: eip.commentDBAddress,
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addNewEIP(orbitdb: any, dbFinder: any, eip: IEIP) {
	const eipDoc = await orbitdb.open(eip.dbAddress, {
		type: "documents",
		AccessController: IPFSAccessController({ write: [...eip.authors, orbitdb.identity.id] }),
	});
	eip.dbAddress = eipDoc.address.toString();
	const coreInfo: ICoreEIPInfo = {
		id: eip.id,
		title: eip.title,
		status: eip.status,
		category: eip.category,
		dbAddress: eip.dbAddress,
	};
	await dbFinder.put(eip.id.toString(), JSON.stringify(coreInfo));

	const commentDoc = await orbitdb.open(`comments-{${eip.id}}`, {
		type: "documents",
		AccessController: IPFSAccessController({ write: ["*"] }),
	});
	eip.commentDBAddress = commentDoc.address.toString();

	await eipDoc.put(eipDocFromEIP(eip));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function changeEIPStatus(orbitdb: any, dbFinder: any, eip: IEIP, newStatus: EIP_STATUS) {
	eip.status = newStatus;
	await dbFinder.put(eip.id.toString(), JSON.stringify(coreInfoFromEIP(eip)));
	const eipDoc = await orbitdb.open(eip.dbAddress, {
		type: "documents",
	});
	await eipDoc.put(eipDocFromEIP(eip));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function changeEIPAuthors(orbitdb: any, dbFinder: any, eip: IEIP, newAuthors: string[]) {
	eip.authors = newAuthors;
	await dbFinder.put(eip.id.toString(), JSON.stringify(coreInfoFromEIP(eip)));
	const eipDoc = await orbitdb.open(eip.dbAddress, {
		type: "documents",
	});
	await eipDoc.put(eipDocFromEIP(eip));
}
