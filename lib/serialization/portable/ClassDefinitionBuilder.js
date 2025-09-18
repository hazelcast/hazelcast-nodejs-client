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
exports.ClassDefinitionBuilder = void 0;
const ClassDefinition_1 = require("./ClassDefinition");
const Portable_1 = require("../Portable");
const core_1 = require("../../core");
/** @internal */
class ClassDefinitionBuilder {
    constructor(factoryId, classId, version = 0) {
        this.fieldDefinitions = [];
        this.index = 0;
        this.factoryId = factoryId;
        this.classId = classId;
        this.version = version;
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
    addByteField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.BYTE, this.version));
    }
    addBooleanField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.BOOLEAN, this.version));
    }
    addCharField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.CHAR, this.version));
    }
    addShortField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.SHORT, this.version));
    }
    addIntField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.INT, this.version));
    }
    addLongField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.LONG, this.version));
    }
    addFloatField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.FLOAT, this.version));
    }
    addDoubleField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.DOUBLE, this.version));
    }
    addStringField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.STRING, this.version));
    }
    addUTFField(fieldName) {
        return this.addStringField(fieldName);
    }
    addPortableField(fieldName, def) {
        if (def.getClassId() === 0) {
            throw new RangeError('Portable class ID cannot be zero!');
        }
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.PORTABLE, def.getVersion(), def.getFactoryId(), def.getClassId()));
    }
    addDecimalField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.DECIMAL, this.version));
    }
    addTimeField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.TIME, this.version));
    }
    addDateField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.DATE, this.version));
    }
    addTimestampField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.TIMESTAMP, this.version));
    }
    addTimestampWithTimezoneField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.TIMESTAMP_WITH_TIMEZONE, this.version));
    }
    addByteArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.BYTE_ARRAY, this.version));
    }
    addBooleanArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.BOOLEAN_ARRAY, this.version));
    }
    addCharArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.CHAR_ARRAY, this.version));
    }
    addShortArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.SHORT_ARRAY, this.version));
    }
    addIntArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.INT_ARRAY, this.version));
    }
    addLongArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.LONG_ARRAY, this.version));
    }
    addFloatArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.FLOAT_ARRAY, this.version));
    }
    addDoubleArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.DOUBLE_ARRAY, this.version));
    }
    addStringArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.STRING_ARRAY, this.version));
    }
    addUTFArrayField(fieldName) {
        return this.addStringArrayField(fieldName);
    }
    addPortableArrayField(fieldName, def) {
        if (def.getClassId() === 0) {
            throw new RangeError('Portable class ID cannot be zero!');
        }
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.PORTABLE_ARRAY, def.getVersion(), def.getFactoryId(), def.getClassId()));
    }
    addDecimalArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.DECIMAL_ARRAY, this.version));
    }
    addTimeArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.TIME_ARRAY, this.version));
    }
    addDateArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.DATE_ARRAY, this.version));
    }
    addTimestampArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.TIMESTAMP_ARRAY, this.version));
    }
    addTimestampWithTimezoneArrayField(fieldName) {
        return this.addField(new ClassDefinition_1.FieldDefinition(this.index, fieldName, Portable_1.FieldType.TIMESTAMP_WITH_TIMEZONE_ARRAY, this.version));
    }
    addField(fieldDefinition) {
        if (this.done) {
            throw new core_1.HazelcastSerializationError(`ClassDefinition is already built for ${this.classId}`);
        }
        if (this.index !== fieldDefinition.getIndex()) {
            throw new RangeError('Invalid field index');
        }
        this.fieldDefinitions.push(fieldDefinition);
        this.index++;
        return this;
    }
    build() {
        this.done = true;
        const cd = new ClassDefinition_1.ClassDefinition(this.factoryId, this.classId, this.version);
        for (const fd of this.fieldDefinitions) {
            cd.addFieldDefinition(fd);
        }
        return cd;
    }
}
exports.ClassDefinitionBuilder = ClassDefinitionBuilder;
//# sourceMappingURL=ClassDefinitionBuilder.js.map