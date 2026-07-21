
import { AsyncLocalStorage } from 'node:async_hooks';
import * as Long from 'long';

const lockContextStorage = new AsyncLocalStorage();
let lockID = Long.ZERO

export class LockContext {
    static async run(f: any) {
        lockID = lockID.add(1);
        await lockContextStorage.run(lockID, f);
    }
}

export function getLockID() {
    const lid = lockContextStorage.getStore();
    return lid || Long.ZERO;
}

