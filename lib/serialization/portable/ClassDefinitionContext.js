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
exports.ClassDefinitionContext = void 0;
const core_1 = require("../../core");
/** @internal */
class ClassDefinitionContext {
    constructor(factoryId) {
        this.factoryId = factoryId;
        this.classDefs = {};
    }
    static encodeVersionedClassId(classId, version) {
        return classId + 'v' + version;
    }
    lookup(classId, version) {
        const encoded = ClassDefinitionContext.encodeVersionedClassId(classId, version);
        return this.classDefs[encoded];
    }
    register(classDefinition) {
        if (classDefinition === null) {
            return null;
        }
        if (classDefinition.getFactoryId() !== this.factoryId) {
            throw new core_1.HazelcastSerializationError(`This factory's number is ${this.factoryId}.
            Intended factory id is ${classDefinition.getFactoryId()}`);
        }
        const cdKey = ClassDefinitionContext.encodeVersionedClassId(classDefinition.getClassId(), classDefinition.getVersion());
        const current = this.classDefs[cdKey];
        if (current == null) {
            this.classDefs[cdKey] = classDefinition;
            return classDefinition;
        }
        if (!current.equals(classDefinition)) {
            throw new core_1.HazelcastSerializationError('Incompatible class definition with same class id: '
                + classDefinition.getClassId());
        }
        return classDefinition;
    }
}
exports.ClassDefinitionContext = ClassDefinitionContext;
//# sourceMappingURL=ClassDefinitionContext.js.map