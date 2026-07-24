
import { AsyncLocalStorage } from 'node:async_hooks';
import * as Long from 'long';

const lockContextStorage = new AsyncLocalStorage();
let lockID = Long.ZERO

export class LockContext {

    /**
     * Runs the given async function / promise with a new lock ID.
     *
     * @param f Promise the async function to run with the lock ID.
     */
    static async run(f: () => Promise<void>) {
        lockID = lockID.add(1);
        await lockContextStorage.run(lockID, f);
    }
}

export function getLockID(): Long {
    const lid = lockContextStorage.getStore();
    if (lid) {
        return lid as Long;
    }
    return Long.ZERO;
}

