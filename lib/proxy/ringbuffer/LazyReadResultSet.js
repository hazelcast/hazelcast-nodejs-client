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
exports.LazyReadResultSet = void 0;
const HazelcastError_1 = require("./../../core/HazelcastError");
/** @internal */
class LazyReadResultSetIterator {
    constructor(list) {
        this.index = 0;
        this.list = list;
    }
    /**
     * Returns the next element in the iteration.
     * @throws {@link HazelcastSerializationError} if the next item is a compact object whose schema is not known
     */
    next() {
        if (this.index < this.list.size()) {
            return { done: false, value: this.list.get(this.index++) };
        }
        else {
            return { done: true, value: undefined };
        }
    }
}
/** @internal */
class LazyReadResultSet {
    constructor(serializationService, readCount, items, itemSeqs, nextSeq) {
        this.serializationService = serializationService;
        this.readCount = readCount;
        this.items = items;
        this.itemSeqs = itemSeqs;
        this.nextSeq = nextSeq;
    }
    getReadCount() {
        return this.readCount;
    }
    get(index) {
        const dataOrObject = this.items[index];
        if (dataOrObject == null) {
            return undefined;
        }
        if (this.serializationService.isData(dataOrObject)) {
            let obj;
            try {
                obj = this.serializationService.toObject(dataOrObject);
            }
            catch (e) {
                if (e instanceof HazelcastError_1.SchemaNotFoundError) {
                    throw new HazelcastError_1.HazelcastSerializationError(e.message, e, e.serverStackTrace);
                }
                throw e;
            }
            this.items[index] = obj;
            return obj;
        }
        else {
            return dataOrObject;
        }
    }
    getSequence(index) {
        return this.itemSeqs[index];
    }
    size() {
        return this.items.length;
    }
    getNextSequenceToReadFrom() {
        return this.nextSeq;
    }
    values() {
        return new LazyReadResultSetIterator(this);
    }
    [Symbol.iterator]() {
        return this.values();
    }
}
exports.LazyReadResultSet = LazyReadResultSet;
//# sourceMappingURL=LazyReadResultSet.js.map