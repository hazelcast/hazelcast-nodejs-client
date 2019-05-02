/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import * as Long from 'long';
import {UnsupportedOperationError} from '../../HazelcastError';
import {Data} from '../../serialization/Data';
import {SerializationService, SerializationServiceV1} from '../../serialization/SerializationService';
import {ReadResultSet} from './ReadResultSet';

export class LazyReadResultSet<T> implements ReadResultSet<T> {
    private readCount: number;
    private items: any[];
    private itemSeqs: Long[];
    private serializationService: SerializationService;

    constructor(serializationService: SerializationService, readCount: number, items: Data[], itemSeqs: Long[]) {
        this.serializationService = serializationService;
        this.readCount = readCount;
        this.items = items;
        this.itemSeqs = itemSeqs;
    }

    getReadCount(): number {
        return this.readCount;
    }

    get(index: number): T {
        const dataOrObject = this.items[index];
        if (dataOrObject == null) {
            return undefined;
        }
        if ((this.serializationService as SerializationServiceV1).isData(dataOrObject)) {
            const obj = this.serializationService.toObject(dataOrObject);
            this.items[index] = obj;
            return obj;
        } else {
            return dataOrObject;
        }
    }

    getSequence(index: number): Long {
        if (this.itemSeqs == null) {
            throw new UnsupportedOperationError('Sequence IDs are not available when the cluster version is lower than 3.9');
        }
        return this.itemSeqs[index];
    }

    size(): number {
        return this.items.length;
    }

}
