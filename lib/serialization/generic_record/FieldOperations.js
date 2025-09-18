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
exports.FieldOperations = void 0;
const FieldKind_1 = require("./FieldKind");
const BitsUtil_1 = require("../../util/BitsUtil");
const FieldValidator_1 = require("./FieldValidator");
const BigDecimal_1 = require("../../core/BigDecimal");
const DateTimeClasses_1 = require("../../core/DateTimeClasses");
const CompactGenericRecord_1 = require("./CompactGenericRecord");
const Long = require("long");
/**
 * Implementation of {@link FieldKindBasedOperations} for each field
 * @internal
 */
class FieldOperations {
    static fieldOperations(fieldKind) {
        return FieldOperations.ALL[fieldKind];
    }
}
exports.FieldOperations = FieldOperations;
FieldOperations.VARIABLE_SIZE = -1;
FieldOperations.ALL = {
    [FieldKind_1.FieldKind.BOOLEAN]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeBoolean(fieldName, record.getBoolean(fieldName));
        },
        kindSizeInBytes() {
            // Boolean is actually 1 bit. To make it look like smaller than Byte we use 0.
            return 0;
        },
        readFromReader(reader, fieldName) {
            return reader.readBoolean(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateType(fieldName, 'boolean', value, getErrorStringFn);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfBoolean(fieldName, record.getArrayOfBoolean(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfBoolean(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.BOOLEAN);
        }
    },
    [FieldKind_1.FieldKind.INT8]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeInt8(fieldName, record.getInt8(fieldName));
        },
        kindSizeInBytes() {
            return BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
        },
        readFromReader(reader, fieldName) {
            return reader.readInt8(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
            FieldValidator_1.FieldValidator.validateInt8Range(fieldName, value);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_INT8]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfInt8(fieldName, record.getArrayOfInt8(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfInt8(fieldName);
        },
        validateField(fieldName, value) {
            if (!Buffer.isBuffer(value) && value !== null) {
                throw new TypeError(FieldValidator_1.FieldValidator.getErrorStringForField(fieldName, 'Buffer or null', value));
            }
        }
    },
    [FieldKind_1.FieldKind.INT16]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeInt16(fieldName, record.getInt16(fieldName));
        },
        kindSizeInBytes() {
            return BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES;
        },
        readFromReader(reader, fieldName) {
            return reader.readInt16(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
            FieldValidator_1.FieldValidator.validateInt16Range(fieldName, value);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_INT16]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfInt16(fieldName, record.getArrayOfInt16(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfInt16(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.INT16);
        }
    },
    [FieldKind_1.FieldKind.INT32]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeInt32(fieldName, record.getInt32(fieldName));
        },
        kindSizeInBytes() {
            return BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
        },
        readFromReader(reader, fieldName) {
            return reader.readInt32(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
            FieldValidator_1.FieldValidator.validateInt32Range(fieldName, value);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_INT32]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfInt32(fieldName, record.getArrayOfInt32(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfInt32(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.INT32);
        }
    },
    [FieldKind_1.FieldKind.INT64]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeInt64(fieldName, record.getInt64(fieldName));
        },
        kindSizeInBytes() {
            return BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
        },
        readFromReader(reader, fieldName) {
            return reader.readInt64(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (!Long.isLong(value)) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'Long', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_INT64]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfInt64(fieldName, record.getArrayOfInt64(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfInt64(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.INT64);
        }
    },
    [FieldKind_1.FieldKind.FLOAT32]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeFloat32(fieldName, record.getFloat32(fieldName));
        },
        kindSizeInBytes() {
            return BitsUtil_1.BitsUtil.FLOAT_SIZE_IN_BYTES;
        },
        readFromReader(reader, fieldName) {
            return reader.readFloat32(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_FLOAT32]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfFloat32(fieldName, record.getArrayOfFloat32(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfFloat32(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.FLOAT32);
        }
    },
    [FieldKind_1.FieldKind.FLOAT64]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeFloat64(fieldName, record.getFloat64(fieldName));
        },
        kindSizeInBytes() {
            return BitsUtil_1.BitsUtil.DOUBLE_SIZE_IN_BYTES;
        },
        readFromReader(reader, fieldName) {
            return reader.readFloat64(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_FLOAT64]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfFloat64(fieldName, record.getArrayOfFloat64(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfFloat64(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.FLOAT64);
        }
    },
    [FieldKind_1.FieldKind.STRING]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeString(fieldName, record.getString(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readString(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (typeof value !== 'string' && value !== null) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'String or null', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_STRING]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfString(fieldName, record.getArrayOfString(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfString(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.STRING);
        }
    },
    [FieldKind_1.FieldKind.DECIMAL]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeDecimal(fieldName, record.getDecimal(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readDecimal(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (!(value instanceof BigDecimal_1.BigDecimal) && value !== null) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'BigDecimal or null', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_DECIMAL]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfDecimal(fieldName, record.getArrayOfDecimal(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfDecimal(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.DECIMAL);
        }
    },
    [FieldKind_1.FieldKind.TIME]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeTime(fieldName, record.getTime(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readTime(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (!(value instanceof DateTimeClasses_1.LocalTime) && value !== null) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'LocalTime or null', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_TIME]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfTime(fieldName, record.getArrayOfTime(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfTime(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.TIME);
        }
    },
    [FieldKind_1.FieldKind.DATE]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeDate(fieldName, record.getDate(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readDate(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (!(value instanceof DateTimeClasses_1.LocalDate) && value !== null) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'LocalDate or null', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_DATE]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfDate(fieldName, record.getArrayOfDate(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfDate(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.DATE);
        }
    },
    [FieldKind_1.FieldKind.TIMESTAMP]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeTimestamp(fieldName, record.getTimestamp(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readTimestamp(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (!(value instanceof DateTimeClasses_1.LocalDateTime) && value !== null) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'LocalDateTime or null', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfTimestamp(fieldName, record.getArrayOfTimestamp(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfTimestamp(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.TIMESTAMP);
        }
    },
    [FieldKind_1.FieldKind.TIMESTAMP_WITH_TIMEZONE]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeTimestampWithTimezone(fieldName, record.getTimestampWithTimezone(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readTimestampWithTimezone(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (!(value instanceof DateTimeClasses_1.OffsetDateTime) && value !== null) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'OffsetDateTime or null', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfTimestampWithTimezone(fieldName, record.getArrayOfTimestampWithTimezone(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfTimestampWithTimezone(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.TIMESTAMP_WITH_TIMEZONE);
        }
    },
    [FieldKind_1.FieldKind.COMPACT]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeGenericRecord(fieldName, record.getGenericRecord(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readCompact(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (value !== null && !(value instanceof CompactGenericRecord_1.CompactGenericRecordImpl)) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'Compact', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_COMPACT]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfGenericRecord(fieldName, record.getArrayOfGenericRecord(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfCompact(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.COMPACT);
        }
    },
    [FieldKind_1.FieldKind.NULLABLE_BOOLEAN]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeNullableBoolean(fieldName, record.getNullableBoolean(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readNullableBoolean(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateNullableType(fieldName, 'boolean', value, getErrorStringFn);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfNullableBoolean(fieldName, record.getArrayOfNullableBoolean(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfNullableBoolean(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.NULLABLE_BOOLEAN);
        }
    },
    [FieldKind_1.FieldKind.NULLABLE_INT8]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeNullableInt8(fieldName, record.getNullableInt8(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readNullableInt8(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
            FieldValidator_1.FieldValidator.validateInt8Range(fieldName, value);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT8]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfNullableInt8(fieldName, record.getArrayOfNullableInt8(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfNullableInt8(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.NULLABLE_INT8);
        }
    },
    [FieldKind_1.FieldKind.NULLABLE_INT16]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeNullableInt16(fieldName, record.getNullableInt16(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readNullableInt16(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
            FieldValidator_1.FieldValidator.validateInt16Range(fieldName, value);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT16]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfNullableInt16(fieldName, record.getArrayOfNullableInt16(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfNullableInt16(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.NULLABLE_INT16);
        }
    },
    [FieldKind_1.FieldKind.NULLABLE_INT32]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeNullableInt32(fieldName, record.getNullableInt32(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readNullableInt32(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
            FieldValidator_1.FieldValidator.validateInt32Range(fieldName, value);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT32]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfNullableInt32(fieldName, record.getArrayOfNullableInt32(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfNullableInt32(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.NULLABLE_INT32);
        }
    },
    [FieldKind_1.FieldKind.NULLABLE_INT64]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeNullableInt64(fieldName, record.getNullableInt64(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readNullableInt64(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            if (!Long.isLong(value) && value !== null) {
                FieldValidator_1.FieldValidator.throwTypeErrorWithMessage(fieldName, 'Long or null', value, getErrorStringFn);
            }
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT64]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfNullableInt64(fieldName, record.getArrayOfNullableInt64(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfNullableInt64(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.NULLABLE_INT64);
        }
    },
    [FieldKind_1.FieldKind.NULLABLE_FLOAT32]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeNullableFloat32(fieldName, record.getNullableFloat32(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readNullableFloat32(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT32]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfNullableFloat32(fieldName, record.getArrayOfNullableFloat32(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfNullableFloat32(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.NULLABLE_FLOAT32);
        }
    },
    [FieldKind_1.FieldKind.NULLABLE_FLOAT64]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeNullableFloat64(fieldName, record.getNullableFloat64(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readNullableFloat64(fieldName);
        },
        validateField(fieldName, value, getErrorStringFn) {
            FieldValidator_1.FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
        }
    },
    [FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT64]: {
        writeFieldFromRecordToWriter(writer, record, fieldName) {
            writer.writeArrayOfNullableFloat64(fieldName, record.getArrayOfNullableFloat64(fieldName));
        },
        kindSizeInBytes() {
            return FieldOperations.VARIABLE_SIZE;
        },
        readFromReader(reader, fieldName) {
            return reader.readArrayOfNullableFloat64(fieldName);
        },
        validateField(fieldName, value) {
            FieldValidator_1.FieldValidator.validateArray(fieldName, value, FieldKind_1.FieldKind.NULLABLE_FLOAT64);
        }
    },
};
//# sourceMappingURL=FieldOperations.js.map