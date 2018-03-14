/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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
    private list: ReadOnlyLazyList<T>;

    constructor(list: ReadOnlyLazyList<T>) {
        this.list = list;
    }

    next(): IteratorResult<T> {
        if (this.index < this.list.size()) {
            return { done: false, value: this.list.get(this.index++) };
        } else {
            return { done: true, value: undefined};
        }
    }

}

export class ReadOnlyLazyList<T> implements Iterable<T> {
    private internalArray: Array<any>;
    private serializationService: SerializationService;

    constructor(array: Array<any>, serializationService: SerializationService) {
        this.internalArray = array;
        this.serializationService = serializationService;
    }

    get(index: number): T {
        let dataOrObject = this.internalArray[index];
        if (dataOrObject == null) {
            return undefined;
        }
        if ((<SerializationServiceV1>this.serializationService).isData(dataOrObject)) {
            let obj = this.serializationService.toObject(dataOrObject);
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

    slice(start: number, end?: number): ReadOnlyLazyList<T> {
        return new ReadOnlyLazyList<T>(this.internalArray.slice(start, end), this.serializationService);
    }

    toArray(): Array<T> {
        let arr: Array<T> = [];
        let iterator = this.values();
        for (let item = iterator.next(); !item.done; item = iterator.next()) {
            arr.push(item.value);
        }
        return arr;
    }

    [Symbol.iterator](): Iterator<T> {
        return this.values();
    }
}

