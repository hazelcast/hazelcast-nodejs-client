/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

class ReadOnlyLazyListIterator<T> implements Iterator<T> {

    private index = 0;
    private list: ReadOnlyLazyListImpl<T>;

    constructor(list: ReadOnlyLazyListImpl<T>) {
        this.list = list;
    }

    next(): IteratorResult<T> {
        if (this.index < this.list.size()) {
            return {done: false, value: this.list.get(this.index++)};
        } else {
            return {done: true, value: undefined};
        }
    }

}

export interface ReadOnlyLazyList<T> extends Iterable<T> {

    /**
     * Returns list's element at the specified index.
     *
     * @param index element's index
     * @returns element
     */
    get(index: number): T;

    /**
     * Returns the size of the list.
     */
    size(): number;

    /**
     * Returns an iterator for elements in the list.
     */
    values(): Iterator<T>;

    /**
     * Returns a slice of the list.
     *
     * @param start The beginning of the specified portion of the list (inclusive).
     * @param end The end of the specified portion of the list (exclusive).
     */
    slice(start: number, end?: number): ReadOnlyLazyListImpl<T>;

    /**
     * Returns an array that contains all elements of this list in proper sequence.
     */
    toArray(): T[];

}

export class ReadOnlyLazyListImpl<T> implements ReadOnlyLazyList<T> {

    private internalArray: any[];
    private serializationService: SerializationService;

    constructor(array: any[], serializationService: SerializationService) {
        this.internalArray = array;
        this.serializationService = serializationService;
    }

    get(index: number): T {
        const dataOrObject = this.internalArray[index];
        if (dataOrObject == null) {
            return undefined;
        }
        if ((this.serializationService as SerializationServiceV1).isData(dataOrObject)) {
            const obj = this.serializationService.toObject(dataOrObject);
            this.internalArray[index] = obj;
            return obj;
        } else {
            return dataOrObject;
        }
    }

    size(): number {
        return this.internalArray.length;
    }

    values(): Iterator<T> {
        return new ReadOnlyLazyListIterator(this);
    }

    slice(start: number, end?: number): ReadOnlyLazyListImpl<T> {
        return new ReadOnlyLazyListImpl<T>(this.internalArray.slice(start, end), this.serializationService);
    }

    toArray(): T[] {
        const arr: T[] = [];
        const iterator = this.values();
        for (let item = iterator.next(); !item.done; item = iterator.next()) {
            arr.push(item.value);
        }
        return arr;
    }

    [Symbol.iterator](): Iterator<T> {
        return this.values();
    }
}
