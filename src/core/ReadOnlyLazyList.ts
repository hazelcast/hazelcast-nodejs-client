/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

class ReadOnlyLazyListIterator<T> implements Iterator<T> {

    private index = 0;
    private list: ReadOnlyLazyList<T>;

    constructor(list: ReadOnlyLazyList<T>) {
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

/**
 * Represents a list of values with lazy deserialization. Lazy deserialization does not work after
 * client version 5.1 due to a technical limitation.
 */
export class ReadOnlyLazyList<T> {

    private readonly internalArray: any[];

    /** @internal */
    constructor(array: any[]) {
        this.internalArray = array;
    }

    /**
     * Returns list's element at the specified index.
     *
     * @param index element's index
     * @returns element
     */
    get(index: number): T {
        const dataOrObject = this.internalArray[index];
        if (dataOrObject == null) {
            return undefined;
        }

        return dataOrObject;
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
        return new ReadOnlyLazyList<T>(this.internalArray.slice(start, end));
    }

    /**
     * Returns an array that contains all elements of this list in proper sequence.
     */
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
