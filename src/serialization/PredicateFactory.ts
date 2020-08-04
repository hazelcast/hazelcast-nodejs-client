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

import {Predicate} from '../core/Predicate';
import {DataInput, DataOutput} from './Data';
import {IdentifiedDataSerializable, IdentifiedDataSerializableFactory} from './Serializable';
import { IllegalStateError } from '../HazelcastError';

export const PREDICATE_FACTORY_ID = -20;

export abstract class AbstractPredicate implements Predicate {

    abstract classId: number;
    factoryId = PREDICATE_FACTORY_ID;

    abstract readData(input: DataInput): any;

    abstract writeData(output: DataOutput): void;
}

export class PredicateFactory implements IdentifiedDataSerializableFactory {

    private idToConstructorMap: { [id: number]: FunctionConstructor } = {};

    constructor(allPredicates: any) {
        for (const pred in allPredicates) {
            if (allPredicates[pred] == null) {
                throw new IllegalStateError('Predicate class expected.');
            }
            const classId = allPredicates[pred].CLASS_ID;
            if (typeof classId !== 'number') {
                throw new IllegalStateError('Predicate class does not have CLASS_ID property.');
            }
            this.idToConstructorMap[classId] = allPredicates[pred];
        }
    }

    create(type: number): IdentifiedDataSerializable {
        if (this.idToConstructorMap[type]) {
            return (new this.idToConstructorMap[type]()) as any;
        } else {
            throw new RangeError(`There is no default predicate with id ${type}.`);
        }
    }
}
