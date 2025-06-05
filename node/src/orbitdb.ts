// File containing functions related to OrbitDB
import { SPECIAL_ID_FOR_EIP, type ICoreEIPInfo, type IEIP } from "@dsync/types";
// @ts-expect-error - OrbitDB is not typed
import { IPFSAccessController } from "@orbitdb/core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addNewEIP(orbitdb: any, dbFinder: any, eip: IEIP) {
	const eipDoc = await orbitdb.open(eip.dbAddress, {
		type: "documents",
		AccessController: IPFSAccessController({ write: [orbitdb.identity.id] }),
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

	await eipDoc.put({
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
	});
}
