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
exports.FieldDefinition = exports.ClassDefinition = void 0;
const assert_1 = require("assert");
/** @internal */
class ClassDefinition {
    constructor(factoryId, classId, version) {
        this.fields = {};
        this.factoryId = factoryId;
        this.classId = classId;
        this.version = version;
    }
    addFieldDefinition(definition) {
        this.fields[definition.getName()] = definition;
    }
    getFieldCount() {
        return Object.keys(this.fields).length;
    }
    getFactoryId() {
        return this.factoryId;
    }
    getClassId() {
        return this.classId;
    }
    getVersion() {
        return this.version;
    }
    getFieldType(name) {
        const field = this.fields[name];
        if (field != null) {
            return field.getType();
        }
        else {
            throw new RangeError(`Field ${field} does not exist.`);
        }
    }
    hasField(name) {
        return this.fields[name] != null;
    }
    getField(name) {
        const field = this.fields[name];
        return field || null;
    }
    getFieldById(index) {
        if (!Number.isInteger(index) || index < 0 || index >= this.getFieldCount()) {
            throw new RangeError(`Index: ${index}, fields count: ${this.getFieldCount()}.`);
        }
        for (const fieldName in this.fields) {
            if (this.fields[fieldName].getIndex() === index) {
                return this.fields[fieldName];
            }
        }
        throw new RangeError(`There is no field with index ${index}`);
    }
    getFieldNames() {
        return Object.keys(this.fields);
    }
    equals(o) {
        if (!(o instanceof ClassDefinition)) {
            return false;
        }
        if (o.factoryId !== this.factoryId || o.classId !== this.classId || o.version !== this.version) {
            return false;
        }
        try {
            (0, assert_1.deepStrictEqual)(o.fields, this.fields);
        }
        catch (e) {
            return false;
        }
        return true;
    }
}
exports.ClassDefinition = ClassDefinition;
/** @internal */
class FieldDefinition {
    constructor(index, fieldName, type, version, factoryId = 0, classId = 0) {
        this.index = index;
        this.fieldName = fieldName;
        this.type = type;
        this.factoryId = factoryId;
        this.classId = classId;
        this.version = version;
    }
    getType() {
        return this.type;
    }
    getName() {
        return this.fieldName;
    }
    getIndex() {
        return this.index;
    }
    getClassId() {
        return this.classId;
    }
    getFactoryId() {
        return this.factoryId;
    }
    getVersion() {
        return this.version;
    }
}
exports.FieldDefinition = FieldDefinition;
//# sourceMappingURL=ClassDefinition.js.map