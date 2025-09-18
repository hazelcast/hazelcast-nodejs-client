"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataKeyedHashMap = void 0;
/** @internal */
class DataKeyedHashMap {
    constructor() {
        this.internalStore = new Map();
        this.size = 0;
    }
    clear() {
        this.size = 0;
        this.internalStore = new Map();
    }
    delete(key) {
        const existingIndex = this.findIndexInBucket(key);
        if (existingIndex === -1) {
            return false;
        }
        else {
            this.getOrCreateBucket(key.hashCode()).splice(existingIndex, 1);
            this.size--;
            return true;
        }
    }
    has(key) {
        return this.findIndexInBucket(key) !== -1;
    }
    get(key) {
        const keyHash = key.hashCode();
        const existingIndex = this.findIndexInBucket(key);
        if (existingIndex !== -1) {
            return this.getOrCreateBucket(keyHash)[existingIndex].value;
        }
        else {
            return undefined;
        }
    }
    set(key, value) {
        const keyHash = key.hashCode();
        const existingIndex = this.findIndexInBucket(key);
        if (existingIndex !== -1) {
            this.getOrCreateBucket(keyHash)[existingIndex].value = value;
        }
        else {
            this.getOrCreateBucket(keyHash).push({ key, value });
            this.size++;
        }
        return this;
    }
    values() {
        const snapshot = [];
        this.internalStore.forEach((bucket) => {
            snapshot.push(...(bucket.map((item) => item.value)));
        });
        return snapshot;
    }
    entries() {
        const snapshot = [];
        this.internalStore.forEach((bucket) => {
            snapshot.push(...(bucket.map((item) => {
                return [item.key, item.value];
            })));
        });
        return snapshot;
    }
    /**
     *
     * @param key
     * @returns index of the key if it exists, -1 if either bucket or item does not exist
     */
    findIndexInBucket(key) {
        const keyHash = key.hashCode();
        const bucket = this.internalStore.get(keyHash);
        if (bucket === undefined) {
            return -1;
        }
        else {
            return bucket.findIndex((item) => {
                return item.key.equals(key);
            });
        }
    }
    getOrCreateBucket(key) {
        let bucket;
        bucket = this.internalStore.get(key);
        if (bucket === undefined) {
            bucket = [];
            this.internalStore.set(key, bucket);
        }
        return bucket;
    }
}
exports.DataKeyedHashMap = DataKeyedHashMap;
class InternalRecord {
}
//# sourceMappingURL=DataStoreHashMap.js.map