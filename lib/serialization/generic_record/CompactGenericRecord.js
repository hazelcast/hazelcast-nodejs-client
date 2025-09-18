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
exports.CompactGenericRecordImpl = void 0;
const core_1 = require("../../core");
const FieldKind_1 = require("./FieldKind");
const SchemaWriter_1 = require("../compact/SchemaWriter");
const FieldDescriptor_1 = require("./FieldDescriptor");
const CompactUtil_1 = require("../compact/CompactUtil");
const FieldValidator_1 = require("./FieldValidator");
const Long = require("long");
/**
 * Represents a deserialized compact generic record. This class is what user gets.
 * @internal
 */
class CompactGenericRecordImpl {
    constructor(typeName, fields, values, 
    // When building from DefaultCompactReader, we can reuse the schema
    schema) {
        this.fields = fields;
        this.values = values;
        if (typeof typeName !== 'string') {
            throw new TypeError('Type name must be a string');
        }
        if (schema !== undefined) {
            this.schema = schema;
            for (const [fieldName, field] of Object.entries(fields)) {
                FieldValidator_1.FieldValidator.validateField(fieldName, field.kind, this.values[fieldName]);
            }
        }
        else {
            const schemaWriter = new SchemaWriter_1.SchemaWriter(typeName);
            for (const [fieldName, field] of Object.entries(fields)) {
                FieldValidator_1.FieldValidator.validateField(fieldName, field.kind, this.values[fieldName]);
                schemaWriter.addField(new FieldDescriptor_1.FieldDescriptor(fieldName, field.kind));
            }
            this.schema = schemaWriter.build();
        }
    }
    clone(fieldsToUpdate) {
        const clonedValues = CompactGenericRecordImpl.deepCloneCompactGenericRecordValues(this.values);
        for (const fieldName in fieldsToUpdate) {
            if (!this.hasField(fieldName)) {
                throw RangeError(`Generic to be cloned does not have a field with name ${fieldName}`);
            }
            clonedValues[fieldName] = fieldsToUpdate[fieldName];
        }
        return new CompactGenericRecordImpl(this.schema.typeName, this.fields, clonedValues);
    }
    getFieldNames() {
        return new Set(Object.keys(this.fields));
    }
    getFieldKind(fieldName) {
        if (!this.schema.fieldDefinitionMap.has(fieldName)) {
            throw RangeError('There is no field named as ' + fieldName);
        }
        return this.schema.fieldDefinitionMap.get(fieldName).kind;
    }
    hasField(fieldName) {
        return this.fields.hasOwnProperty(fieldName);
    }
    getBoolean(fieldName) {
        return this.getNonNull(fieldName, FieldKind_1.FieldKind.BOOLEAN, FieldKind_1.FieldKind.NULLABLE_BOOLEAN, 'Boolean');
    }
    getInt8(fieldName) {
        return this.getNonNull(fieldName, FieldKind_1.FieldKind.INT8, FieldKind_1.FieldKind.NULLABLE_INT8, 'Int8');
    }
    getInt16(fieldName) {
        return this.getNonNull(fieldName, FieldKind_1.FieldKind.INT16, FieldKind_1.FieldKind.NULLABLE_INT16, 'Int16');
    }
    getInt32(fieldName) {
        return this.getNonNull(fieldName, FieldKind_1.FieldKind.INT32, FieldKind_1.FieldKind.NULLABLE_INT32, 'Int32');
    }
    getInt64(fieldName) {
        return this.getNonNull(fieldName, FieldKind_1.FieldKind.INT64, FieldKind_1.FieldKind.NULLABLE_INT64, 'Int64');
    }
    getFloat32(fieldName) {
        return this.getNonNull(fieldName, FieldKind_1.FieldKind.FLOAT32, FieldKind_1.FieldKind.NULLABLE_FLOAT32, 'Float32');
    }
    getFloat64(fieldName) {
        return this.getNonNull(fieldName, FieldKind_1.FieldKind.FLOAT64, FieldKind_1.FieldKind.NULLABLE_FLOAT64, 'Float64');
    }
    getString(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.STRING);
    }
    getDecimal(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.DECIMAL);
    }
    getTime(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.TIME);
    }
    getDate(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.DATE);
    }
    getTimestamp(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.TIMESTAMP);
    }
    getTimestampWithTimezone(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.TIMESTAMP_WITH_TIMEZONE);
    }
    getGenericRecord(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.COMPACT);
    }
    getArrayOfBoolean(fieldName) {
        return this.getArrayOfPrimitives(fieldName, 'ArrayOfBoolean', FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN);
    }
    getArrayOfInt8(fieldName) {
        return Buffer.from(this.getArrayOfPrimitives(fieldName, 'ArrayOfInt8', FieldKind_1.FieldKind.ARRAY_OF_INT8, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT8));
    }
    getArrayOfInt16(fieldName) {
        return this.getArrayOfPrimitives(fieldName, 'ArrayOfInt16', FieldKind_1.FieldKind.ARRAY_OF_INT16, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT16);
    }
    getArrayOfInt32(fieldName) {
        return this.getArrayOfPrimitives(fieldName, 'ArrayOfInt32', FieldKind_1.FieldKind.ARRAY_OF_INT32, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT32);
    }
    getArrayOfInt64(fieldName) {
        return this.getArrayOfPrimitives(fieldName, 'ArrayOfInt64', FieldKind_1.FieldKind.ARRAY_OF_INT64, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT64);
    }
    getArrayOfFloat32(fieldName) {
        return this.getArrayOfPrimitives(fieldName, 'ArrayOfFloat32', FieldKind_1.FieldKind.ARRAY_OF_FLOAT32, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT32);
    }
    getArrayOfFloat64(fieldName) {
        return this.getArrayOfPrimitives(fieldName, 'ArrayOfFloat64', FieldKind_1.FieldKind.ARRAY_OF_FLOAT64, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT64);
    }
    getArrayOfString(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.ARRAY_OF_STRING);
    }
    getArrayOfDecimal(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.ARRAY_OF_DECIMAL);
    }
    getArrayOfTime(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIME);
    }
    getArrayOfDate(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.ARRAY_OF_DATE);
    }
    getArrayOfTimestamp(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP);
    }
    getArrayOfTimestampWithTimezone(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE);
    }
    getArrayOfGenericRecord(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.ARRAY_OF_COMPACT);
    }
    getNullableBoolean(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.BOOLEAN, FieldKind_1.FieldKind.NULLABLE_BOOLEAN);
    }
    getNullableInt8(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.INT8, FieldKind_1.FieldKind.NULLABLE_INT8);
    }
    getNullableInt16(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.INT16, FieldKind_1.FieldKind.NULLABLE_INT16);
    }
    getNullableInt32(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.INT32, FieldKind_1.FieldKind.NULLABLE_INT32);
    }
    getNullableInt64(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.INT64, FieldKind_1.FieldKind.NULLABLE_INT64);
    }
    getNullableFloat32(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.FLOAT32, FieldKind_1.FieldKind.NULLABLE_FLOAT32);
    }
    getNullableFloat64(fieldName) {
        return this.get(fieldName, FieldKind_1.FieldKind.FLOAT64, FieldKind_1.FieldKind.NULLABLE_FLOAT64);
    }
    getArrayOfNullableBoolean(fieldName) {
        return this.getArrayOfNullables(fieldName, FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN);
    }
    getArrayOfNullableInt8(fieldName) {
        return this.getArrayOfNullables(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT8, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT8);
    }
    getArrayOfNullableInt16(fieldName) {
        return this.getArrayOfNullables(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT16, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT16);
    }
    getArrayOfNullableInt32(fieldName) {
        return this.getArrayOfNullables(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT32, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT32);
    }
    getArrayOfNullableInt64(fieldName) {
        return this.getArrayOfNullables(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT64, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT64);
    }
    getArrayOfNullableFloat32(fieldName) {
        return this.getArrayOfNullables(fieldName, FieldKind_1.FieldKind.ARRAY_OF_FLOAT32, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT32);
    }
    getArrayOfNullableFloat64(fieldName) {
        return this.getArrayOfNullables(fieldName, FieldKind_1.FieldKind.ARRAY_OF_FLOAT64, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT64);
    }
    toString() {
        // replaces BigDecimals with strings to avoid BigInt error of JSON.stringify.
        // Also replaces some data types to make them more readable.
        return JSON.stringify({
            [this.schema.typeName]: this.values
        }, (key, value) => {
            if (value instanceof CompactGenericRecordImpl) {
                return value.values;
            }
            if (value instanceof core_1.BigDecimal) {
                return {
                    type: 'BigDecimal',
                    data: value.toString()
                };
            }
            if (value instanceof Long) {
                return {
                    type: 'Long',
                    data: value.toString()
                };
            }
            if (value instanceof core_1.LocalTime) {
                return {
                    type: 'LocalTime',
                    data: value.toString()
                };
            }
            if (value instanceof core_1.LocalDate) {
                return {
                    type: 'LocalDate',
                    data: value.toString()
                };
            }
            if (value instanceof core_1.LocalDateTime) {
                return {
                    type: 'LocalDateTime',
                    data: value.toString()
                };
            }
            if (value instanceof core_1.OffsetDateTime) {
                return {
                    type: 'OffsetDateTime',
                    data: value.toString()
                };
            }
            return value;
        });
    }
    getSchema() {
        return this.schema;
    }
    /**
     * Deep clones an object. Based on: https://stackoverflow.com/a/34624648/9483495
     * @param obj
     */
    static deepCloneCompactGenericRecordValues(obj) {
        // Prevent undefined objects
        if (!obj) {
            return obj;
        }
        if (obj instanceof CompactGenericRecordImpl) {
            return obj.clone();
        }
        if (obj instanceof Long) {
            return new Long(obj.low, obj.high, obj.unsigned);
        }
        if (Buffer.isBuffer(obj)) {
            return Buffer.from(obj);
        }
        if (obj instanceof core_1.LocalDate) {
            return new core_1.LocalDate(obj.year, obj.month, obj.date);
        }
        if (obj instanceof core_1.LocalTime) {
            return new core_1.LocalTime(obj.hour, obj.minute, obj.second, obj.nano);
        }
        if (obj instanceof core_1.LocalDateTime) {
            return new core_1.LocalDateTime(obj.localDate, obj.localTime);
        }
        if (obj instanceof core_1.OffsetDateTime) {
            return new core_1.OffsetDateTime(obj.localDateTime, obj.offsetSeconds);
        }
        if (obj instanceof core_1.BigDecimal) {
            return new core_1.BigDecimal(obj.unscaledValue, obj.scale);
        }
        let v;
        const cloned = Array.isArray(obj) ? [] : {};
        for (const k in obj) {
            v = obj[k];
            cloned[k] = (typeof v === 'object') ? CompactGenericRecordImpl.deepCloneCompactGenericRecordValues(v) : v;
        }
        return cloned;
    }
    check(fieldName, firstKind, secondKind) {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === undefined) {
            throw new core_1.HazelcastSerializationError(`Invalid field name: '${fieldName}' for schema ${this.schema}`);
        }
        const fieldKind = fd.kind;
        let fieldKindsString = FieldKind_1.FieldKind[firstKind];
        let valid = false;
        valid = valid || (fieldKind === firstKind);
        if (secondKind !== undefined) {
            valid = valid || (fieldKind === secondKind);
            fieldKindsString += ` or ${FieldKind_1.FieldKind[secondKind]}`;
        }
        if (!valid) {
            throw new core_1.HazelcastSerializationError(`Invalid field kind: '${fieldKind}' for schema '${this.schema}',`
                + `valid field kinds: ${fieldKindsString}, found: ${fieldKind}`);
        }
        return fieldKind;
    }
    getNonNull(fieldName, primitiveFieldKind, nullableFieldKind, methodSuffix) {
        this.check(fieldName, primitiveFieldKind, nullableFieldKind);
        const value = this.values[fieldName];
        if (value === null) {
            throw CompactUtil_1.CompactExceptions.toExceptionForUnexpectedNullValue(fieldName, methodSuffix);
        }
        return value;
    }
    get(fieldName, firstKind, secondKind) {
        this.check(fieldName, firstKind, secondKind);
        return this.values[fieldName];
    }
    getArrayOfPrimitives(fieldName, methodSuffix, primitiveFieldKind, nullableFieldKind) {
        const fieldKind = this.check(fieldName, primitiveFieldKind, nullableFieldKind);
        if (fieldKind === nullableFieldKind) {
            const array = this.values[fieldName];
            const result = new Array(array.length);
            for (let i = 0; i < array.length; i++) {
                if (array[i] === null) {
                    throw CompactUtil_1.CompactExceptions.toExceptionForUnexpectedNullValueInArray(fieldName, methodSuffix);
                }
                result[i] = array[i];
            }
            return result;
        }
        return this.values[fieldName];
    }
    getArrayOfNullables(fieldName, primitiveFieldKind, nullableFieldKind) {
        this.check(fieldName, primitiveFieldKind, nullableFieldKind);
        return this.values[fieldName];
    }
}
exports.CompactGenericRecordImpl = CompactGenericRecordImpl;
//# sourceMappingURL=CompactGenericRecord.js.map