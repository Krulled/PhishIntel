import { openDB } from 'idb';
const DB_NAME = 'phishintel-db';
const STORE = 'results';
async function db() {
    return openDB(DB_NAME, 1, {
        upgrade(database) {
            if (!database.objectStoreNames.contains(STORE)) {
                database.createObjectStore(STORE);
            }
        },
    });
}
export async function saveResult(id, result) {
    const d = await db();
    await d.put(STORE, result, id);
}
export async function getResult(id) {
    const d = await db();
    return d.get(STORE, id);
}
