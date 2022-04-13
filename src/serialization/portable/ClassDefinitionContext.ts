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
/** @ignore *//** */

import {ClassDefinition} from './ClassDefinition';
import {HazelcastSerializationError} from '../../core';

/** @internal */
export class ClassDefinitionContext {
    private readonly factoryId: number;

    private readonly classDefs: { [classId: string]: ClassDefinition };

    constructor(factoryId: number) {
        this.factoryId = factoryId;
        this.classDefs = {};
    }

    private static encodeVersionedClassId(classId: number, version: number): string {
        return classId + 'v' + version;
    }

    lookup(classId: number, version: number): ClassDefinition {
        const encoded = ClassDefinitionContext.encodeVersionedClassId(classId, version);
        return this.classDefs[encoded];
    }

    register(classDefinition: ClassDefinition): ClassDefinition {
        if (classDefinition === null) {
            return null;
        }
        if (classDefinition.getFactoryId() !== this.factoryId) {
            throw new HazelcastSerializationError(`This factory's number is ${this.factoryId}.
            Intended factory id is ${classDefinition.getFactoryId()}`);
        }
        const cdKey = ClassDefinitionContext.encodeVersionedClassId(
            classDefinition.getClassId(), classDefinition.getVersion());
        const current = this.classDefs[cdKey];
        if (current == null) {
            this.classDefs[cdKey] = classDefinition;
            return classDefinition;
        }

        if (!current.equals(classDefinition)) {
            throw new HazelcastSerializationError('Incompatible class definition with same class id: '
                + classDefinition.getClassId());
        }

        return classDefinition;
    }
}
