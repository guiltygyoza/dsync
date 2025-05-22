import { OrbitDB } from "@orbitdb/core";
import { DBFinder as DBFinderClass } from "./dbfinder";
import type { ComponentLogger } from '@libp2p/interface'
import type { ConnectionManager, Registrar } from '@libp2p/interface-internal'

export interface DBFinder {
    findDB(dbName: string): Promise<String>;
    addDB(dbName: string): Promise<boolean>;

    db: OrbitDB;
}


export interface DBFinderInit {

}

export interface DBFinderComponents {
    registrar: Registrar
    connectionManager: ConnectionManager
    logger: ComponentLogger
  }

export function dbFinder(init: DBFinderInit = {}): (components: DBFinderComponents) => DBFinder {
    return  (components: DBFinderComponents) => new DBFinderClass(components);
}

export { DB_FINDER_PROTOCOL } from './constants.js'
