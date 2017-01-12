import {Data} from './serialization/Data';
export class DataKeyedHashMap<T> {

    private internalStore: Map<number, Array<InternalRecord<T>>>;

    size: number;

    constructor() {
        this.internalStore = new Map();
        this.size = 0;
    }

    clear(): void {
        this.size = 0;
        this.internalStore = new Map();
    }

    delete(key: Data): boolean {
        var existingIndex = this.findIndexInBucket(key);
        if (existingIndex === -1) {
            return false;
        } else {
            this.getOrCreateBucket(key.hashCode()).splice(existingIndex, 1);
            this.size--;
            return true;
        }
    }

    has(key: Data): boolean {
        return this.findIndexInBucket(key) !== -1;
    }

    get(key: Data): T {
        var keyHash = key.hashCode();
        var existingIndex = this.findIndexInBucket(key);
        if (existingIndex !== -1) {
            return this.getOrCreateBucket(keyHash)[existingIndex].value;
        } else {
            return undefined;
        }
    }

    set(key: Data, value: any): this {
        var keyHash = key.hashCode();
        var existingIndex = this.findIndexInBucket(key);
        if (existingIndex !== -1) {
            this.getOrCreateBucket(keyHash)[existingIndex].value = value;
        } else {
            this.getOrCreateBucket(keyHash).push({key: key, value: value});
            this.size++;
        }
        return this;
    }

    values(): Array<T> {
        var snapshot: Array<T> = [];
        this.internalStore.forEach((bucket: Array<InternalRecord<T>>) => {
            snapshot.push(...(bucket.map((item: InternalRecord<T>) => { return item.value; })));
        });
        return snapshot;
    }

    entries(): Array<[Data, T]> {
        var snapshot: Array<[Data, T]> = [];
        this.internalStore.forEach((bucket: Array<InternalRecord<T>>) => {
            snapshot.push(...(bucket.map((item: InternalRecord<T>) => {
                return <[Data, T]>[item.key, item.value];
            })));
        });
        return snapshot;
    }

    /**
     *
     * @param key
     * @returns index of the key if it exists, -1 if either bucket or item does not exist
     */
    private findIndexInBucket(key: Data): number {
        var keyHash = key.hashCode();
        var bucket = this.internalStore.get(keyHash);
        if (bucket === undefined) {
            return -1;
        } else {
            return bucket.findIndex((item: InternalRecord<T> ) => {
                return item.key.equals(key);
            });
        }
    }

    private getOrCreateBucket(key: number): Array<InternalRecord<T>> {
        var bucket: Array<InternalRecord<T>>;
        bucket = this.internalStore.get(key);
        if (bucket === undefined) {
            bucket = [];
            this.internalStore.set(key, bucket);
        }
        return bucket;
    }
}

class InternalRecord<T> {
    key: Data;
    value: T;
}
