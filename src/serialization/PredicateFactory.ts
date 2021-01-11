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

import {Predicate} from '../core/Predicate';
import {DataInput, DataOutput} from './Data';
import {IdentifiedDataSerializable, IdentifiedDataSerializableFactory} from './Serializable';

export const PREDICATE_FACTORY_ID = -32;

export abstract class AbstractPredicate implements Predicate {

    abstract readData(input: DataInput): any;

    abstract writeData(output: DataOutput): void;

    getFactoryId(): number {
        return PREDICATE_FACTORY_ID;
    }

    abstract getClassId(): number;
}

export class PredicateFactory implements IdentifiedDataSerializableFactory {

    private idToConstructorMap: { [id: number]: FunctionConstructor } = {};

    constructor(allPredicates: any) {
        for (const pred in allPredicates) {
            // TODO accessing getClassId from prototype of uninitialized member function is not elegant.
            this.idToConstructorMap[(allPredicates[pred].prototype as any).getClassId()] = allPredicates[pred];
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
