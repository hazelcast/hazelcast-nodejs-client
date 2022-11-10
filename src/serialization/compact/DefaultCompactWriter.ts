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

import {CompactWriter} from './CompactWriter';
import {
    BigDecimal,
    HazelcastSerializationError,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
} from '../../core';
import * as Long from 'long';
import {GenericRecord} from '../generic_record/GenericRecord';
import {CompactStreamSerializer} from './CompactStreamSerializer';
import {PositionalObjectDataOutput} from '../ObjectData';
import {Schema} from './Schema';
import {BitsUtil} from '../../util/BitsUtil';
import {FieldKind} from '../generic_record/FieldKind';
import {FieldDescriptor} from '../generic_record/FieldDescriptor';
import {IOUtil} from '../../util/IOUtil';
import {BYTE_OFFSET_READER_RANGE, NULL_OFFSET, SHORT_OFFSET_READER_RANGE} from './OffsetConstants';
import {CompactGenericRecordImpl} from '../generic_record/CompactGenericRecord';

/**
 *
 * Default implementation of the {@link CompactWriter} that writes
 * the serialized fields into a {@link PositionalObjectDataOutput}.
 *
 * @internal
 */
export class DefaultCompactWriter implements CompactWriter {
    private readonly dataStartPosition : number;
    private readonly fieldOffsets: Array<number> | null;

    constructor(
        private readonly serializer: CompactStreamSerializer,
        private readonly out: PositionalObjectDataOutput,
        private readonly schema: Schema
    ) {
        if (schema.numberVarSizeFields !== 0) {
            this.fieldOffsets = new Array<number>(schema.numberVarSizeFields);
            this.dataStartPosition = out.position() + BitsUtil.INT_SIZE_IN_BYTES;
            // Skip for length and primitives
            this.out.writeZeroBytes(schema.fixedSizeFieldsLength + BitsUtil.INT_SIZE_IN_BYTES);
        } else {
            this.fieldOffsets = null;
            this.dataStartPosition = out.position();
            // Skip for primitives. No need to write data length, when there is no variable-size fields.
            out.writeZeroBytes(schema.fixedSizeFieldsLength);
        }
    }

    writeBoolean(fieldName: string, value: boolean): void {
        const fieldDefinition = this.checkFieldDefinition(fieldName, FieldKind.BOOLEAN);
        const offsetInBytes = fieldDefinition.offset;
        const offsetInBits = fieldDefinition.bitOffset;
        const writeOffset = offsetInBytes + this.dataStartPosition;
        this.out.pwriteBooleanBit(writeOffset, offsetInBits, value);
    }

    writeInt8(fieldName: string, value: number): void {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind.INT8);
        this.out.pwriteInt8(position, value);
    }

    writeInt16(fieldName: string, value: number): void {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind.INT16);
        this.out.pwriteShort(position, value);
    }

    writeInt32(fieldName: string, value: number): void {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind.INT32);
        this.out.pwriteInt(position, value);
    }

    writeInt64(fieldName: string, value: Long): void {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind.INT64);
        this.out.pwriteLong(position, value);
    }

    writeFloat32(fieldName: string, value: number): void {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind.FLOAT32);
        this.out.pwriteFloat(position, value);
    }

    writeFloat64(fieldName: string, value: number): void {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind.FLOAT64);
        this.out.pwriteDouble(position, value);
    }

    writeString(fieldName: string, value: string | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.STRING, value, (out, value) => {
            out.writeString(value);
        });
    }

    writeDecimal(fieldName: string, value: BigDecimal | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.DECIMAL, value, IOUtil.writeDecimal);
    }

    writeTime(fieldName: string, value: LocalTime | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.TIME, value, IOUtil.writeLocalTime);
    }

    writeDate(fieldName: string, value: LocalDate | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.DATE, value, IOUtil.writeLocalDate);
    }

    writeTimestamp(fieldName: string, value: LocalDateTime | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.TIMESTAMP, value, IOUtil.writeLocalDateTime);
    }

    writeTimestampWithTimezone(fieldName: string, value: OffsetDateTime | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.TIMESTAMP_WITH_TIMEZONE, value, IOUtil.writeOffsetDateTime);
    }

    writeCompact<T>(fieldName: string, value: T | null): void {
        return this.writeVariableSizeField(fieldName, FieldKind.COMPACT, value, (out, value) => {
            return this.serializer.writeObject(out, value);
        });
    }

    writeArrayOfBoolean(fieldName: string, value: boolean[] | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.ARRAY_OF_BOOLEAN, value, DefaultCompactWriter.writeBooleanBits);
    }

    writeArrayOfInt8(fieldName: string, value: Buffer | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.ARRAY_OF_INT8, value, (out, value) => {
            out.writeByteArray(value);
        });
    }

    writeArrayOfInt16(fieldName: string, value: number[] | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.ARRAY_OF_INT16, value, (out, values) => {
            out.writeShortArray(values);
        });
    }

    writeArrayOfInt32(fieldName: string, value: number[] | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.ARRAY_OF_INT32, value, (out, values) => {
            out.writeIntArray(values);
        });
    }

    writeArrayOfInt64(fieldName: string, value: Long[] | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.ARRAY_OF_INT64, value, (out, values) => {
            out.writeLongArray(values);
        });
    }

    writeArrayOfFloat32(fieldName: string, value: number[] | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.ARRAY_OF_FLOAT32, value, (out, values) => {
            out.writeFloatArray(values);
        });
    }

    writeArrayOfFloat64(fieldName: string, value: number[] | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.ARRAY_OF_FLOAT64, value, (out, values) => {
            out.writeDoubleArray(values);
        });
    }

    writeArrayOfString(fieldName: string, value: (string | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_STRING, value, (out, value) => {
            out.writeString(value);
        });
    }

    writeArrayOfDecimal(fieldName: string, value: (BigDecimal | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_DECIMAL, value, IOUtil.writeDecimal);
    }

    writeArrayOfTime(fieldName: string, value: (LocalTime | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIME, value, IOUtil.writeLocalTime);
    }

    writeArrayOfDate(fieldName: string, value: (LocalDate | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_DATE, value, IOUtil.writeLocalDate);
    }

    writeArrayOfTimestamp(fieldName: string, value: (LocalDateTime | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIMESTAMP, value, IOUtil.writeLocalDateTime);
    }

    writeArrayOfTimestampWithTimezone(fieldName: string, value: (OffsetDateTime | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE, value, IOUtil.writeOffsetDateTime);
    }

    writeArrayOfCompact<T>(fieldName: string, value: (T | null)[] | null): void {
        const singleTypeCompactArrayItemChecker = new SingleTypeCompactArrayItemChecker();
        return this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_COMPACT, value, (out, value) => {
            singleTypeCompactArrayItemChecker.check(value);
            return this.serializer.writeObject(out, value);
        });
    }

    writeNullableBoolean(fieldName: string, value: boolean | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.NULLABLE_BOOLEAN, value, (out, value) => {
            out.writeBoolean(value);
        });
    }

    writeNullableInt8(fieldName: string, value: number | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.NULLABLE_INT8, value, (out, value) => {
            out.writeInt8(value);
        });
    }

    writeNullableInt16(fieldName: string, value: number | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.NULLABLE_INT16, value, (out, value) => {
            out.writeShort(value);
        });
    }

    writeNullableInt32(fieldName: string, value: number | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.NULLABLE_INT32, value, (out, value) => {
            out.writeInt(value);
        });
    }

    writeNullableInt64(fieldName: string, value: Long | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.NULLABLE_INT64, value, (out, value) => {
            out.writeLong(value);
        });
    }

    writeNullableFloat32(fieldName: string, value: number | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.NULLABLE_FLOAT32, value, (out, value) => {
            out.writeFloat(value);
        });
    }

    writeNullableFloat64(fieldName: string, value: number | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.NULLABLE_FLOAT64, value, (out, value) => {
            out.writeDouble(value);
        });
    }

    writeArrayOfNullableBoolean(fieldName: string, value: (boolean | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN, value, (out, value) => {
            out.writeBoolean(value);
        });
    }

    writeArrayOfNullableInt8(fieldName: string, value: (number | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT8, value, (out, value) => {
            out.writeInt8(value);
        });
    }

    writeArrayOfNullableInt16(fieldName: string, value: (number | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT16, value, (out, value) => {
            out.writeShort(value);
        });
    }

    writeArrayOfNullableInt32(fieldName: string, value: (number | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT32, value, (out, value) => {
            out.writeInt(value);
        });
    }

    writeArrayOfNullableInt64(fieldName: string, value: (Long | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT64, value, (out, value) => {
            out.writeLong(value);
        });
    }

    writeArrayOfNullableFloat32(fieldName: string, value: (number | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT32, value, (out, value) => {
            out.writeFloat(value);
        });
    }

    writeArrayOfNullableFloat64(fieldName: string, value: (number | null)[] | null): void {
        this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT64, value, (out, value) => {
            out.writeDouble(value);
        });
    }

    writeGenericRecord(fieldName: string, value: GenericRecord): void {
        return this.writeVariableSizeField(fieldName, FieldKind.COMPACT, value, (out, value) => {
            return this.serializer.writeGenericRecord(out, value as CompactGenericRecordImpl);
        });
    }

    writeArrayOfGenericRecord(fieldName: string, value: GenericRecord[]) : void {
        const singleSchemaCompactArrayItemChecker = new SingleSchemaCompactArrayItemChecker();
        return this.writeArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_COMPACT, value, (out, value) => {
            singleSchemaCompactArrayItemChecker.check(value);
            return this.serializer.writeGenericRecord(out, value as CompactGenericRecordImpl);
        });
    }

    end(): void {
        if (this.schema.numberVarSizeFields === 0) {
            // There are no variable size fields
            return;
        }
        const position = this.out.position();
        const dataLength = position - this.dataStartPosition;
        this.writeOffsets(dataLength, this.fieldOffsets);
        // write dataLength
        this.out.pwriteInt(this.dataStartPosition - BitsUtil.INT_SIZE_IN_BYTES, dataLength);
    }

    private writeOffsets(dataLength: number, offsets: Array<number>) {
        if (dataLength < BYTE_OFFSET_READER_RANGE) {
            for (const offset of offsets) {
                this.out.writeByte(offset);
            }
        } else if (dataLength < SHORT_OFFSET_READER_RANGE) {
            for (const offset of offsets) {
                this.out.writeShort(offset);
            }
        } else {
            for (const offset of offsets) {
                this.out.writeInt(offset);
            }
        }
    }

    private writeVariableSizeField<T>(
        fieldName: string,
        fieldKind: FieldKind,
        object: T | null,
        writeFn: (out: PositionalObjectDataOutput, value: T) => void
    ) : void {
        if (object === null) {
            this.setPositionAsNull(fieldName, fieldKind);
        } else {
            this.setPosition(fieldName, fieldKind);
            writeFn(this.out, object);
        }
    }

    private writeArrayOfVariableSizes<T>(
        fieldName: string,
        fieldKind: FieldKind,
        values: T[] | null,
        writeFn: (out: PositionalObjectDataOutput, value: T) => void
    ) : void {
        if (values === null) {
            this.setPositionAsNull(fieldName, fieldKind);
            return;
        }
        this.setPosition(fieldName, fieldKind);
        const dataLengthOffset = this.out.position();
        this.out.writeZeroBytes(BitsUtil.INT_SIZE_IN_BYTES);
        const itemCount = values.length;
        this.out.writeInt(itemCount);

        const offset = this.out.position();
        const offsets = new Array<number>(itemCount);
        for (let i = 0; i < itemCount; i++) {
            if (values[i] !== null) {
                offsets[i] = this.out.position() - offset;
                writeFn(this.out, values[i]);
            } else {
                offsets[i] = NULL_OFFSET;
            }
        }
        const dataLength = this.out.position() - offset;
        this.out.pwriteInt(dataLengthOffset, dataLength);
        this.writeOffsets(dataLength, offsets);
    }

    private setPositionAsNull(fieldName: string, fieldKind: FieldKind) {
        const field = this.checkFieldDefinition(fieldName, fieldKind);
        const index = field.index;
        this.fieldOffsets[index] = -1;
    }

    private setPosition(fieldName: string, fieldKind: FieldKind) {
        const field = this.checkFieldDefinition(fieldName, fieldKind);
        const position = this.out.position();
        const fieldPosition = position - this.dataStartPosition;
        const index = field.index;
        this.fieldOffsets[index] = fieldPosition;
    }

    private checkFieldDefinition(fieldName: string, fieldKind: FieldKind) : FieldDescriptor {
        const field = this.schema.fieldDefinitionMap.get(fieldName);
        if (field === undefined) {
            throw new HazelcastSerializationError(`Invalid field name: ${fieldName} for ${this.schema}`);
        }
        if (field.kind !== fieldKind) {
            throw new HazelcastSerializationError(`Invalid field type: ${fieldName} for ${this.schema}`);
        }
        return field;
    }

    private getFixedSizeFieldPosition(fieldName: string, fieldKind: FieldKind) : number {
        const fieldDefinition = this.checkFieldDefinition(fieldName, fieldKind);
        return fieldDefinition.offset + this.dataStartPosition;
    }

    private static writeBooleanBits(out: PositionalObjectDataOutput, booleans: boolean[] | null) : void {
        const length = booleans.length;
        out.writeInt(length);
        let position = out.position();
        if (length > 0) {
            let index = 0;
            out.writeZeroBytes(1);
            for (const boolean of booleans) {
                if (index === BitsUtil.BITS_IN_A_BYTE) {
                    index = 0;
                    out.writeZeroBytes(1);
                    position++;
                }
                out.pwriteBooleanBit(position, index, boolean);
                index++;
            }
        }
    }
}

/**
 * Checks that the Compact serializable array items that are written are of
 * a single type.
 */
export class SingleTypeCompactArrayItemChecker<T> {
    
    // eslint-disable-next-line @typescript-eslint/ban-types
    private clazz: Function;
    
    public check(value: T): void {
        const clazzType = value.constructor;
        if (this.clazz == null) {
            this.clazz = clazzType;
        }
        if (this.clazz !== clazzType) {
            throw new HazelcastSerializationError('It is not allowed to '
                    + 'serialize an array of Compact serializable objects '
                    + 'containing different item types. Expected array item '
                    + 'type: ' + this.clazz.name + ', current item type: ' + clazzType.name);
        }
    }
}
/**
 * Checks that the Compact serializable GenericRecord array items that are
 * written are of a single schema.
 */
export class SingleSchemaCompactArrayItemChecker {

    private schema: Schema;

    public check(value: GenericRecord): void {
        const record: CompactGenericRecordImpl = value as CompactGenericRecordImpl;
        const schema = record.getSchema();
        if (this.schema == null) {
            this.schema = schema;
        }
        
        if (!this.schema.schemaId.equals(schema.schemaId)) {
            throw new HazelcastSerializationError('It is not allowed to '
                    + 'serialize an array of Compact serializable '
                    + 'GenericRecord objects containing different schemas. '
                    + 'Expected array item schema: ' + this.schema 
                    + ', current schema: ' + schema);
        }
    }
}