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

import {SerializationService, SerializationServiceV1} from '../serialization/SerializationService';
import { HazelcastSerializationError, SchemaNotFoundError } from './HazelcastError';

class ReadOnlyLazyListIterator<T> implements Iterator<T> {

    private index = 0;
    private list: ReadOnlyLazyList<T>;

    constructor(list: ReadOnlyLazyList<T>) {
        this.list = list;
    }

    /**
     * Returns the next element in the iteration.
     * @throws {@link HazelcastSerializationError} if the next item is a compact object whose schema is not known
     */
    next(): IteratorResult<T> {
        if (this.index < this.list.size()) {
            return {done: false, value: this.list.get(this.index++)};
        } else {
            return {done: true, value: undefined};
        }
    }

}

/**
 * Represents a list of values with lazy deserialization. Iterating over this list and some of its methods will
 * throw {@link HazelcastSerializationError} in case a compact object is read and its schema is not known by the client.
 */
export class ReadOnlyLazyList<T> {

    private readonly internalArray: any[];
    private readonly serializationService: SerializationService;

    /** @internal */
    constructor(array: any[], serializationService: SerializationService) {
        this.internalArray = array;
        this.serializationService = serializationService;
    }

    /**
     * Returns list's element at the specified index.
     *
     * @param index element's index
     * @throws {@link HazelcastSerializationError} if the object to be returned is a compact object whose schema is not known
     * @returns element
     */
    get(index: number): T {
        const dataOrObject = this.internalArray[index];
        if (dataOrObject == null) {
            return undefined;
        }
        if ((this.serializationService as SerializationServiceV1).isData(dataOrObject)) {
            let obj;
            try {
                obj = this.serializationService.toObject(dataOrObject);
            } catch (e) {
                if (e instanceof SchemaNotFoundError) {
                    throw new HazelcastSerializationError(e.message, e, e.serverStackTrace);
                }
                throw e;
            }
            this.internalArray[index] = obj;
            return obj;
        } else {
            return dataOrObject;
        }
    }

    /**
     * Returns the size of the list.
     */
    size(): number {
        return this.internalArray.length;
    }

    /**
     * Returns an iterator for elements in the list.
     */
    values(): Iterator<T> {
        return new ReadOnlyLazyListIterator(this);
    }

    /**
     * Returns a slice of the list.
     *
     * @param start The beginning of the specified portion of the list (inclusive).
     * @param end The end of the specified portion of the list (exclusive).
     */
    slice(start: number, end?: number): ReadOnlyLazyList<T> {
        return new ReadOnlyLazyList<T>(this.internalArray.slice(start, end), this.serializationService);
    }

    /**
     * Returns an array that contains all elements of this list in proper sequence.
     * @throws {@link HazelcastSerializationError} if the list includes a compact object whose schema is not known
     */
    toArray(): T[] {
        const arr: T[] = [];
        const iterator = this.values();
        try {
            for (let item = iterator.next(); !item.done; item = iterator.next()) {
                arr.push(item.value);
            }
        } catch (e) {
            if (e instanceof SchemaNotFoundError) {
                throw new HazelcastSerializationError(e.message, e.cause, e.serverStackTrace);
            }
            throw e;
        }

        return arr;
    }

    [Symbol.iterator](): Iterator<T> {
        return this.values();
    }
}
