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
exports.ClassDefinitionWriter = void 0;
const ClassDefinitionBuilder_1 = require("./ClassDefinitionBuilder");
const core_1 = require("../../core");
/** @internal */
class ClassDefinitionWriter {
    constructor(context, builder) {
        this.context = context;
        this.builder = builder;
    }
    writeInt(fieldName, _value) {
        this.builder.addIntField(fieldName);
    }
    writeLong(fieldName, _value) {
        this.builder.addLongField(fieldName);
    }
    writeString(fieldName, _value) {
        this.builder.addStringField(fieldName);
    }
    writeUTF(fieldName, str) {
        this.writeString(fieldName, str);
    }
    writeBoolean(fieldName, _value) {
        this.builder.addBooleanField(fieldName);
    }
    writeByte(fieldName, _value) {
        this.builder.addByteField(fieldName);
    }
    writeChar(fieldName, _value) {
        this.builder.addCharField(fieldName);
    }
    writeDouble(fieldName, _value) {
        this.builder.addDoubleField(fieldName);
    }
    writeFloat(fieldName, _value) {
        this.builder.addFloatField(fieldName);
    }
    writeShort(fieldName, _value) {
        this.builder.addShortField(fieldName);
    }
    writePortable(fieldName, portable) {
        if (portable == null) {
            throw new core_1.HazelcastSerializationError('Cannot write null portable without explicitly '
                + 'registering class definition!');
        }
        const version = this.context.getClassVersion(portable);
        const nestedClassDef = this.createNestedClassDef(portable, new ClassDefinitionBuilder_1.ClassDefinitionBuilder(portable.factoryId, portable.classId, version));
        this.builder.addPortableField(fieldName, nestedClassDef);
    }
    writeNullPortable(fieldName, factoryId, classId) {
        const nestedClassDef = this.context.lookupClassDefinition(factoryId, classId, this.context.getVersion());
        if (nestedClassDef == null) {
            throw new core_1.HazelcastSerializationError('Cannot write null portable without explicitly '
                + 'registering class definition!');
        }
        this.builder.addPortableField(fieldName, nestedClassDef);
    }
    writeDecimal(fieldName, _value) {
        this.builder.addDecimalField(fieldName);
    }
    writeTime(fieldName, _value) {
        this.builder.addTimeField(fieldName);
    }
    writeDate(fieldName, _value) {
        this.builder.addDateField(fieldName);
    }
    writeTimestamp(fieldName, _value) {
        this.builder.addTimestampField(fieldName);
    }
    writeTimestampWithTimezone(fieldName, _value) {
        this.builder.addTimestampWithTimezoneField(fieldName);
    }
    writeByteArray(fieldName, _value) {
        this.builder.addByteArrayField(fieldName);
    }
    writeBooleanArray(fieldName, _value) {
        this.builder.addBooleanArrayField(fieldName);
    }
    writeCharArray(fieldName, _value) {
        this.builder.addCharArrayField(fieldName);
    }
    writeIntArray(fieldName, _value) {
        this.builder.addIntArrayField(fieldName);
    }
    writeLongArray(fieldName, _value) {
        this.builder.addLongArrayField(fieldName);
    }
    writeDoubleArray(fieldName, _value) {
        this.builder.addDoubleArrayField(fieldName);
    }
    writeFloatArray(fieldName, _value) {
        this.builder.addFloatArrayField(fieldName);
    }
    writeShortArray(fieldName, _value) {
        this.builder.addShortArrayField(fieldName);
    }
    writeStringArray(fieldName, _value) {
        this.builder.addStringArrayField(fieldName);
    }
    writeUTFArray(fieldName, val) {
        this.writeStringArray(fieldName, val);
    }
    writePortableArray(fieldName, portables) {
        if (portables == null || portables.length === 0) {
            throw new core_1.HazelcastSerializationError('Cannot write null portable array without explicitly '
                + 'registering class definition!');
        }
        const portable = portables[0];
        const classId = portable.classId;
        for (let i = 1; i < portables.length; i++) {
            if (portables[i].classId !== classId) {
                throw new RangeError('Detected different class-ids in portable array!');
            }
        }
        const version = this.context.getClassVersion(portable);
        const nestedClassDef = this.createNestedClassDef(portable, new ClassDefinitionBuilder_1.ClassDefinitionBuilder(portable.factoryId, portable.classId, version));
        this.builder.addPortableArrayField(fieldName, nestedClassDef);
    }
    writeDecimalArray(fieldName, _value) {
        this.builder.addDecimalArrayField(fieldName);
    }
    writeTimeArray(fieldName, _value) {
        this.builder.addTimeArrayField(fieldName);
    }
    writeDateArray(fieldName, _value) {
        this.builder.addDateArrayField(fieldName);
    }
    writeTimestampArray(fieldName, _value) {
        this.builder.addTimestampArrayField(fieldName);
    }
    writeTimestampWithTimezoneArray(fieldName, _value) {
        this.builder.addTimestampWithTimezoneArrayField(fieldName);
    }
    registerAndGet() {
        const cd = this.builder.build();
        return this.context.registerClassDefinition(cd);
    }
    createNestedClassDef(portable, nestedBuilder) {
        const writer = new ClassDefinitionWriter(this.context, nestedBuilder);
        portable.writePortable(writer);
        return this.context.registerClassDefinition(nestedBuilder.build());
    }
}
exports.ClassDefinitionWriter = ClassDefinitionWriter;
//# sourceMappingURL=ClassDefinitionWriter.js.map