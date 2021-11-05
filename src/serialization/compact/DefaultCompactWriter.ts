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
/** @ignore *//** */

import {CompactWriter} from './CompactWriter';
import {
    BigDecimal,
    HazelcastSerializationError,
    IllegalStateError,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime
} from '../../core';
import * as Long from 'long';
import {GenericRecord} from '../generic_record/GenericRecord';
import {CompactStreamSerializer} from './CompactStreamSerializer';
import {PositionalObjectDataOutput} from '../ObjectData';
import {Schema} from './Schema';
import {BitsUtil} from '../../util/BitsUtil';
import {FieldKind} from '../generic_record/FieldKind';
import {FieldDescriptor} from '../generic_record/FieldDescriptor';

/**
 * @internal
 */
export class DefaultCompactWriter implements CompactWriter {

    private static readonly BYTE_MAX_VALUE = 127;
    private static readonly BYTE_MIN_VALUE = -128;

    private static readonly SHORT_MAX_VALUE = 32767;
    private static readonly SHORT_MIN_VALUE = -32768;

    /**
     * Range of the offsets that can be represented by a single byte
     * and can be read with BYTE_OFFSET_READER.
     */
    private static readonly BYTE_OFFSET_READER_RANGE = DefaultCompactWriter.BYTE_MAX_VALUE - DefaultCompactWriter.BYTE_MIN_VALUE;

    /**
     * Offset of the null fields.
     */
    private static readonly NULL_OFFSET = -1;

    /**
     * Range of the offsets that can be represented by two bytes
     * and can be read with SHORT_OFFSET_READER.
     */
    private static readonly SHORT_OFFSET_READER_RANGE
        = DefaultCompactWriter.SHORT_MAX_VALUE - DefaultCompactWriter.SHORT_MIN_VALUE

    private readonly dataStartPosition : number;
    private readonly fieldOffsets: Array<number> | null;

    constructor(
        private readonly serializer: CompactStreamSerializer,
        private readonly out: PositionalObjectDataOutput,
        private readonly schema: Schema,
        private readonly includeSchemaOnBinary: boolean
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

    end(): void {
        try {
            if (this.schema.numberVarSizeFields === 0) {
                // There are no variable size fields
                return;
            }
            const position = this.out.position();
            const dataLength = position - this.dataStartPosition;
            this.writeOffsets(dataLength, this.fieldOffsets);
            // write dataLength
            this.out.pwriteInt(this.dataStartPosition - BitsUtil.INT_SIZE_IN_BYTES, dataLength);
        } catch (e) {
            throw DefaultCompactWriter.illegalStateException(e);
        }
    }

    private static illegalStateException(e : Error) {
        return new IllegalStateError('IOException is not expected from BufferObjectDataOutput ', e);
    }

    private writeOffsets(dataLength: number, offsets: Array<number>) {
        if (dataLength < DefaultCompactWriter.BYTE_OFFSET_READER_RANGE) {
            for (const offset of offsets) {
                this.out.writeByte(offset);
            }
        } else if (dataLength < DefaultCompactWriter.SHORT_OFFSET_READER_RANGE) {
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
        writeFn: (out: PositionalObjectDataOutput, value: T | null) => void
    ) : void {
        try {
            if (object === null) {
                this.setPositionAsNull(fieldName, fieldKind);
            } else {
                this.setPosition(fieldName, fieldKind);
                writeFn(this.out, object);
            }
        } catch (e) {
            throw DefaultCompactWriter.illegalStateException(e);
        }
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
            throw new HazelcastSerializationError(`Invalid field name: ${fieldName} for ${JSON.stringify(this.schema)}`);
        }
        if (field.kind !== fieldKind) {
            throw new HazelcastSerializationError(`Invalid field type: ${fieldName} for ${JSON.stringify(this.schema)}`);
        }
        return field;
    }

    private static writeBooleanBits(out: PositionalObjectDataOutput, booleans: boolean[] | null) : void {
        const length = booleans !== null ? booleans.length : BitsUtil.NULL_ARRAY_LENGTH;
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
            }
        }
    }


    writeArrayOfBooleans(fieldName: string, value: boolean[] | null): void {
        this.writeVariableSizeField(fieldName, FieldKind.ARRAY_OF_BOOLEANS, value, DefaultCompactWriter.writeBooleanBits);
    }

    writeArrayOfBytes(fieldName: string, value: Buffer | null): void {
        this.writeVariableSizeField(
            fieldName,
            FieldKind.ARRAY_OF_BYTES,
            value,
            (out, value) => {out.writeByteArray(value);}
        );
    }

    writeArrayOfCompacts<T>(fieldName: string, value: T[] | null): void {
    }

    writeArrayOfDates(fieldName: string, value: LocalDate[] | null): void {
    }

    writeArrayOfDecimals(fieldName: string, value: BigDecimal[] | null): void {
    }

    writeArrayOfDoubles(fieldName: string, value: number[] | null): void {
    }

    writeArrayOfFloats(fieldName: string, value: number[] | null): void {
    }

    writeArrayOfInts(fieldName: string, value: number[] | null): void {
    }

    writeArrayOfLongs(fieldName: string, value: Long[] | null): void {
    }

    writeArrayOfNullableBooleans(fieldName: string, value: (boolean | null)[] | null): void {
    }

    writeArrayOfNullableBytes(fieldName: string, value: (number | null)[] | null): void {
    }

    writeArrayOfNullableDoubles(fieldName: string, value: (number | null)[] | null): void {
    }

    writeArrayOfNullableFloats(fieldName: string, value: (number | null)[] | null): void {
    }

    writeArrayOfNullableInts(fieldName: string, value: (number | null)[] | null): void {
    }

    writeArrayOfNullableLongs(fieldName: string, value: (Long | null)[] | null): void {
    }

    writeArrayOfNullableShorts(fieldName: string, value: (number | null)[] | null): void {
    }

    writeArrayOfShorts(fieldName: string, value: number[] | null): void {
    }

    writeArrayOfStrings(fieldName: string, value: string[] | null): void {
    }

    writeArrayOfTimes(fieldName: string, value: LocalTime[] | null): void {
    }

    writeArrayOfTimestampWithTimezones(fieldName: string, value: OffsetDateTime[] | null): void {
    }

    writeArrayOfTimestamps(fieldName: string, value: LocalDateTime[] | null): void {
    }

    writeBoolean(fieldName: string, value: boolean): void {
    }

    writeByte(fieldName: string, value: number): void {
    }

    writeCompact<T>(fieldName: string, value: T | null): void {
    }

    writeDate(fieldName: string, value: LocalDate | null): void {
    }

    writeDecimal(fieldName: string, value: BigDecimal | null): void {
    }

    writeDouble(fieldName: string, value: number): void {
    }

    writeFloat(fieldName: string, value: number): void {
    }

    writeInt(fieldName: string, value: number): void {
    }

    writeLong(fieldName: string, value: Long): void {
    }

    writeNullableBoolean(fieldName: string, value: boolean | null): void {
    }

    writeNullableByte(fieldName: string, value: number | null): void {
    }

    writeNullableDouble(fieldName: string, value: number | null): void {
    }

    writeNullableFloat(fieldName: string, value: number | null): void {
    }

    writeNullableInt(fieldName: string, value: number | null): void {
    }

    writeNullableLong(fieldName: string, value: Long | null): void {
    }

    writeNullableShort(fieldName: string, value: number | null): void {
    }

    writeShort(fieldName: string, value: number): void {
    }

    writeString(fieldName: string, value: string | null): void {
    }

    writeTime(fieldName: string, value: LocalTime | null): void {
    }

    writeTimestamp(fieldName: string, value: LocalDateTime | null): void {
    }

    writeTimestampWithTimezone(fieldName: string, value: OffsetDateTime | null): void {
    }

    writeGenericRecord(fieldName: string, value: GenericRecord): void {

    }
    writeArrayOfGenericRecords(fieldName: string, value: GenericRecord[]) : void {

    }
}
