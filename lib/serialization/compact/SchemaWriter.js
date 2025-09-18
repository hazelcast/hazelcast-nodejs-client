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
exports.SchemaWriter = void 0;
const Schema_1 = require("./Schema");
const core_1 = require("../../core");
const FieldDescriptor_1 = require("../generic_record/FieldDescriptor");
const FieldKind_1 = require("../generic_record/FieldKind");
/**
 * @internal
 */
class SchemaWriter {
    constructor(typeName) {
        this.typeName = typeName;
        this.fields = [];
        this.fieldNames = new Set();
    }
    writeBoolean(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.BOOLEAN));
    }
    writeInt8(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.INT8));
    }
    writeInt16(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.INT16));
    }
    writeInt32(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.INT32));
    }
    writeInt64(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.INT64));
    }
    writeFloat32(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.FLOAT32));
    }
    writeFloat64(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.FLOAT64));
    }
    writeString(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.STRING));
    }
    writeDecimal(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.DECIMAL));
    }
    writeTime(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.TIME));
    }
    writeDate(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.DATE));
    }
    writeTimestamp(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.TIMESTAMP));
    }
    writeTimestampWithTimezone(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.TIMESTAMP_WITH_TIMEZONE));
    }
    writeCompact(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.COMPACT));
        return Promise.resolve();
    }
    writeArrayOfBoolean(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN));
    }
    writeArrayOfInt8(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT8));
    }
    writeArrayOfInt16(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT16));
    }
    writeArrayOfInt32(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT32));
    }
    writeArrayOfInt64(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT64));
    }
    writeArrayOfFloat32(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_FLOAT32));
    }
    writeArrayOfFloat64(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_FLOAT64));
    }
    writeArrayOfString(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_STRING));
    }
    writeArrayOfDecimal(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_DECIMAL));
    }
    writeArrayOfTime(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIME));
    }
    writeArrayOfDate(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_DATE));
    }
    writeArrayOfTimestamp(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP));
    }
    writeArrayOfTimestampWithTimezone(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE));
    }
    writeArrayOfCompact(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_COMPACT));
        return Promise.resolve();
    }
    writeNullableBoolean(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.NULLABLE_BOOLEAN));
    }
    writeNullableInt8(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.NULLABLE_INT8));
    }
    writeNullableInt16(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.NULLABLE_INT16));
    }
    writeNullableInt32(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.NULLABLE_INT32));
    }
    writeNullableInt64(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.NULLABLE_INT64));
    }
    writeNullableFloat32(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.NULLABLE_FLOAT32));
    }
    writeNullableFloat64(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.NULLABLE_FLOAT64));
    }
    writeArrayOfNullableBoolean(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN));
    }
    writeArrayOfNullableInt8(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT8));
    }
    writeArrayOfNullableInt16(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT16));
    }
    writeArrayOfNullableInt32(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT32));
    }
    writeArrayOfNullableInt64(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT64));
    }
    writeArrayOfNullableFloat32(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT32));
    }
    writeArrayOfNullableFloat64(fieldName, value) {
        this.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT64));
    }
    addField(field) {
        if (this.fieldNames.has(field.fieldName)) {
            throw new core_1.HazelcastSerializationError('Field with the name ' + field.fieldName + ' already exists');
        }
        this.fieldNames.add(field.fieldName);
        this.fields.push(field);
    }
    build() {
        return new Schema_1.Schema(this.typeName, this.fields.sort((field1, field2) => {
            return field1.fieldName > field2.fieldName ? 1 : -1;
        }));
    }
}
exports.SchemaWriter = SchemaWriter;
//# sourceMappingURL=SchemaWriter.js.map