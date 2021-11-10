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

import {
    BigDecimal,
    HazelcastSerializationError,
    IllegalArgumentError,
    IllegalStateError,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
    UnsupportedOperationError
} from '../../core';
import {GenericRecord} from './GenericRecord';
import * as Long from 'long';
import {FieldKind} from './FieldKind';
import {Schema} from '../compact/Schema';
import {ObjectDataInput} from '../ObjectData';
import {OffsetReader} from '../compact/OffsetReader';
import {FieldDescriptor} from './FieldDescriptor';
import {BitsUtil} from '../../util/BitsUtil';
import {
    BYTE_OFFSET_READER,
    BYTE_OFFSET_READER_RANGE,
    INT_OFFSET_READER,
    NULL_OFFSET,
    SHORT_OFFSET_READER,
    SHORT_OFFSET_READER_RANGE
} from '../compact/OffsetConstants';
import {CompactUtil} from '../compact/CompactUtil';
import {FieldOperations} from './FieldOperations';
import {IOUtil} from '../../util/IOUtil';
import {CompactStreamSerializer} from '../compact/CompactStreamSerializer';
import {AbstractCompactGenericRecord} from './AbstractCompactGenericRecord';

/**
 * @internal
 */
export class CompactInternalGenericRecord extends AbstractCompactGenericRecord {
    protected readonly offsetReader: OffsetReader;
    protected readonly variableOffsetsPosition: number;
    protected readonly dataStartPosition: number;

    constructor(
        private readonly serializer: CompactStreamSerializer,
        protected readonly input: ObjectDataInput,
        protected readonly schema: Schema,
        private readonly className: string | null,
        private readonly schemaIncludedInBinary: boolean
    ) {
        super();
    }

    private static toUnknownFieldException(fieldName: string, schema: Schema) : Error {
        return new HazelcastSerializationError(`Unknown field name: '${fieldName}' for schema ${JSON.stringify(schema)}`);
    }

    private static toIllegalStateException(e : Error) {
        return new IllegalStateError('IOException is not expected since we get from a well known format and position', e);
    }

    private static toUnexpectedFieldKind(fieldKind: FieldKind, fieldName: string) : Error {
        return new HazelcastSerializationError(`Unknown fieldKind: '${fieldKind}' for field: ${fieldName}`);
    }

    private readVariableSizeFieldPosition(fieldDescriptor: FieldDescriptor) : number {
        try {
            const index = fieldDescriptor.index;
            const offset = this.offsetReader.getOffset(this.input, this.variableOffsetsPosition, index);
            return offset === NULL_OFFSET ? NULL_OFFSET : offset + this.dataStartPosition;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        }
    }

    private readVariableSizeFieldPositionByNameAndKind(fieldName: string, fieldKind: FieldKind) : number {
        try {
            const fd = this.getFieldDefinition(fieldName);
            const index = fd.index;
            const offset = this.offsetReader.getOffset(this.input, this.variableOffsetsPosition, index);
            return offset === NULL_OFFSET ? NULL_OFFSET : offset + this.dataStartPosition;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        }
    }

    private getVariableSize<R>(fieldDescriptor: FieldDescriptor, readFn: (reader: ObjectDataInput) => R) : R {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPosition(fieldDescriptor);
            if (pos === NULL_OFFSET) {
                return null;
            }
            this.input.position(pos);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private static getOffsetReader(dataLength: number) : OffsetReader {
        if (dataLength < BYTE_OFFSET_READER_RANGE) {
            return BYTE_OFFSET_READER;
        } else if (dataLength < SHORT_OFFSET_READER_RANGE) {
            return SHORT_OFFSET_READER;
        } else {
            return INT_OFFSET_READER;
        }
    }

    private getNullableArrayAsPrimitiveArray<T>(
        fd: FieldDescriptor, readFn: (reader: ObjectDataInput) => T, methodSuffix: string
    ) : T {
        const currentPos = this.input.position();
        try {
            const position = this.readVariableSizeFieldPosition(fd);
            if (position === BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            }
            this.input.position(position);

            const dataLen = this.input.readInt();
            const itemCount = this.input.readInt();
            const dataStartPosition = this.input.position();

            const offsetReader = CompactInternalGenericRecord.getOffsetReader(dataLen);
            const offsetsPosition = dataStartPosition + dataLen;
            for (let i = 0; i < itemCount; i++) {
                const offset = offsetReader.getOffset(this.input, offsetsPosition, i);
                if (offset === BitsUtil.NULL_ARRAY_LENGTH) {
                    throw CompactUtil.toExceptionForUnexpectedNullValueInArray(fd.fieldName, methodSuffix);
                }
            }
            this.input.position(dataStartPosition - BitsUtil.INT_SIZE_IN_BYTES);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getFieldDefinition(fieldName: string) : FieldDescriptor {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === null) {
            throw CompactInternalGenericRecord.toUnknownFieldException(fieldName, this.schema);
        }
        return fd;
    }

    private getFieldDefinitionChecked(fieldName: string, fieldKind: FieldKind) : FieldDescriptor {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd.kind !== fieldKind) {
            throw CompactInternalGenericRecord.toUnexpectedFieldKind(fd.kind, fieldName);
        }
        return fd;
    }

    private static readBooleanBits(input: ObjectDataInput) : boolean[] | null {
        const len = input.readInt();
        if (len === BitsUtil.NULL_ARRAY_LENGTH) {
            return null;
        }
        if (len === 0) {
            return [];
        }
        const values = new Array<boolean>(len);
        let index = 0;
        let currentByte = input.readByte();
        for (let i = 0; i < len; i++) {
            if (index === BitsUtil.BITS_IN_A_BYTE) {
                index = 0;
                currentByte = input.readByte();
            }
            const result = ((currentByte >>> index) & 1) !== 0;
            index++;
            values[i] = result;
        }
        return values;
    }

    private readLength(beginPosition: number) : number {
        try {
            return this.input.readInt(beginPosition);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        }
    }

    private static checkArrayIndexNotNegative(index: number): number {
        if (index < 0) {
            throw new IllegalArgumentError(`Array index must be non-negative: ${index}`);
        }
        return index;
    }

    private getFixedSizeFieldFromArray<T>(
        fieldName: string, fieldKind: FieldKind, readFn: (reader: ObjectDataInput) => T, index: number
    ) : T {
        CompactInternalGenericRecord.checkArrayIndexNotNegative(index);

        const position = this.readVariableSizeFieldPositionByNameAndKind(fieldName, fieldKind);
        if (position === BitsUtil.NULL_ARRAY_LENGTH) {
            return null;
        }
        if (this.readLength(position) <= index) {
            return null;
        }

        const currentPos = this.input.position();
        try {
            const singleKind = FieldOperations.getSingleKind(fieldKind);
            const kindSize = FieldOperations.fieldOperations(singleKind).kindSizeInBytes();
            this.input.position(BitsUtil.INT_SIZE_IN_BYTES + position + index * kindSize);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getVariableSizeFromArray<T>(
        fieldName: string, fieldKind: FieldKind, readFn: (reader: ObjectDataInput) => T, index: number
    ) : T {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPositionByNameAndKind(fieldName, fieldKind);
            if (pos === NULL_OFFSET) {
                return null;
            }
            const dataLength = this.input.readInt(pos);
            const itemCount = this.input.readInt(pos + BitsUtil.INT_SIZE_IN_BYTES);

            CompactInternalGenericRecord.checkArrayIndexNotNegative(index);

            if (itemCount <= index) {
                return null;
            }

            const dataStartPosition = pos + 2 * BitsUtil.INT_SIZE_IN_BYTES;
            const offsetReader = CompactInternalGenericRecord.getOffsetReader(dataLength);
            const offsetsPosition = dataStartPosition + dataLength;
            const indexedItemOffset = offsetReader.getOffset(this.input, offsetsPosition, index);
            if (indexedItemOffset === NULL_OFFSET) {
                return null;
            }
            this.input.position(indexedItemOffset + dataStartPosition);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getArrayOfVariableSizesWithFieldDescriptor<T> (
        fieldDescriptor: FieldDescriptor, readFn: (reader: ObjectDataInput) => T
    ) {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPosition(fieldDescriptor);
            if (pos === BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            }
            this.input.position(pos);
            const dataLength = this.input.readInt();
            const itemCount = this.input.readInt();

            const dataStartPosition = this.input.position();
            const values = new Array<T>(itemCount);

            const offsetReader = CompactInternalGenericRecord.getOffsetReader(dataLength);
            const offsetsPosition = dataStartPosition + dataLength;
            for (let i = 0; i < itemCount; i++) {
                const offset = offsetReader.getOffset(this.input, offsetsPosition, i);
                if (offset !== BitsUtil.NULL_ARRAY_LENGTH) {
                    this.input.position(offset + dataStartPosition);
                    values[i] = readFn(this.input);
                }
            }
            return values;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getArrayOfVariableSizes<T>(
        fieldName: string,
        fieldKind: FieldKind,
        readFn: (reader: ObjectDataInput) => T
    ) {
        const fieldDefinition = this.getFieldDefinitionChecked(fieldName, fieldKind);
        return this.getArrayOfVariableSizesWithFieldDescriptor(fieldDefinition, readFn);
    }

    getBooleanFromArray(fieldName: string, index: number): boolean {
        const position = this.readVariableSizeFieldPositionByNameAndKind(fieldName, FieldKind.ARRAY_OF_BOOLEANS);
        if (position === NULL_OFFSET) {
            return null;
        }
        if (this.readLength(position) <= index) {
            return null;
        }

        const currentPos = this.input.position();
        try {
            const booleanOffsetInBytes = Math.trunc(index / BitsUtil.BITS_IN_A_BYTE);
            const booleanOffsetWithinLastByte = index % BitsUtil.BITS_IN_A_BYTE;
            const b = this.input.readByte(BitsUtil.INT_SIZE_IN_BYTES + position + booleanOffsetInBytes);
            return ((b >>> booleanOffsetWithinLastByte) & 1) !== 0;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    getByteFromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_BYTES, reader => reader.readByte(), index);
    }
    getCharFromArray(fieldName: string, index: number): string {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_CHARS, reader => reader.readChar(), index);
    }
    getShortFromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_SHORTS, reader => reader.readShort(), index);
    }
    getIntFromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_INTS, reader => reader.readInt(), index);
    }
    getLongFromArray(fieldName: string, index: number): Long {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_LONGS, reader => reader.readLong(), index);
    }
    getFloatFromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_FLOATS, reader => reader.readFloat(), index);
    }
    getDoubleFromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_DOUBLES, reader => reader.readDouble(), index);
    }
    getStringFromArray(fieldName: string, index: number): string {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_STRINGS, reader => reader.readString(), index);
    }
    getGenericRecordFromArray(fieldName: string, index: number): GenericRecord {
        return this.getVariableSizeFromArray(
            fieldName,
            FieldKind.ARRAY_OF_COMPACTS,
            reader => this.serializer.readGenericRecord(reader, this.schemaIncludedInBinary),
            index
        );
    }
    getObjectFromArray<T>(fieldName: string, index: number): T {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_COMPACTS, reader => this.serializer.read(reader, this.schemaIncludedInBinary), index
        );
    }
    getArrayOfObjects<T>(fieldName: string, componentType: new () => T): T[] {
        return this.getArrayOfVariableSizes(
            fieldName,
            FieldKind.ARRAY_OF_COMPACTS,
            reader => this.serializer.read(reader, this.schemaIncludedInBinary)
        );
    }

    getDecimalFromArray(fieldName: string, index: number): BigDecimal {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_DECIMALS, IOUtil.readDecimal, index);
    }
    getTimeFromArray(fieldName: string, index: number): LocalTime {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_TIMES, IOUtil.readLocalTime, index);
    }
    getDateFromArray(fieldName: string, index: number): LocalDate {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_DATES, IOUtil.readLocalDate, index);
    }
    getTimestampFromArray(fieldName: string, index: number): LocalDateTime {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_TIMESTAMPS, IOUtil.readLocalDateTime, index);
    }
    getTimestampWithTimezoneFromArray(fieldName: string, index: number): OffsetDateTime {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES, IOUtil.readOffsetDateTime, index
        );
    }
    getNullableBooleanFromArray(fieldName: string, index: number): boolean {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEANS, reader => reader.readBoolean(), index
        );
    }
    getNullableByteFromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_BYTES, reader => reader.readByte(), index
        );
    }
    getNullableShortFromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_SHORTS, reader => reader.readShort(), index
        );
    }
    getNullableIntFromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_INTS, reader => reader.readInt(), index
        );
    }
    getNullableLongFromArray(fieldName: string, index: number): Long {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_LONGS, reader => reader.readLong(), index
        );
    }
    getNullableFloatFromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOATS, reader => reader.readFloat(), index
        );
    }
    getNullableDoubleFromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_DOUBLES, reader => reader.readDouble(), index
        );
    }

    protected isFieldExists(fieldName: string, kind: FieldKind) : boolean {
        const field = this.schema.fieldDefinitionMap.get(fieldName);
        if (field === undefined) {
            return false;
        }
        return field.kind === kind;
    }

    getArrayOfBooleans(fieldName: string): boolean[] {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.ARRAY_OF_BOOLEANS:
                return this.getVariableSize(fd, CompactInternalGenericRecord.readBooleanBits);
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEANS:
                return this.getNullableArrayAsPrimitiveArray(fd, (input) => input.readBooleanArray(), 'Booleans');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getArrayOfBytes(fieldName: string): Buffer {
        return undefined;
    }

    getArrayOfChars(fieldName: string): string[] {
        throw new UnsupportedOperationError('Compact format does not support reading an array of chars field.');
    }

    getArrayOfDates(fieldName: string): LocalDate[] {
        return [];
    }

    getArrayOfDecimals(fieldName: string): BigDecimal[] {
        return [];
    }

    getArrayOfDoubles(fieldName: string): number[] {
        return [];
    }

    getArrayOfFloats(fieldName: string): number[] {
        return [];
    }

    getArrayOfGenericRecords(fieldName: string): GenericRecord[] {
        return [];
    }

    getArrayOfInts(fieldName: string): number[] {
        return [];
    }

    getArrayOfLongs(fieldName: string): Long[] {
        return [];
    }

    getArrayOfNullableBooleans(fieldName: string): (boolean | null)[] {
        return [];
    }

    getArrayOfNullableBytes(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfNullableDoubles(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfNullableFloats(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfNullableInts(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfNullableLongs(fieldName: string): (Long | null)[] {
        return [];
    }

    getArrayOfNullableShorts(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfShorts(fieldName: string): number[] {
        return [];
    }

    getArrayOfStrings(fieldName: string): string[] {
        return [];
    }

    getArrayOfTimes(fieldName: string): LocalTime[] {
        return [];
    }

    getArrayOfTimestampWithTimezones(fieldName: string): OffsetDateTime[] {
        return [];
    }

    getArrayOfTimestamps(fieldName: string): LocalDateTime[] {
        return [];
    }

    getBoolean(fieldName: string): boolean {
        return false;
    }

    getByte(fieldName: string): number {
        return 0;
    }

    getChar(fieldName: string): string {
        throw new UnsupportedOperationError('Compact format does not support reading a char field.');
    }

    protected getClassIdentifier(): any {
    }

    getDate(fieldName: string): LocalDate {
        return undefined;
    }

    getDecimal(fieldName: string): BigDecimal {
        return undefined;
    }

    getDouble(fieldName: string): number {
        return 0;
    }

    getFieldKind(fieldName: string): FieldKind {
        return undefined;
    }

    getFieldNames(): Set<string> {
        return undefined;
    }

    getFloat(fieldName: string): number {
        return 0;
    }

    getGenericRecord(fieldName: string): GenericRecord {
        return undefined;
    }

    getInt(fieldName: string): number {
        return 0;
    }

    getLong(fieldName: string): Long {
        return undefined;
    }

    getNullableBoolean(fieldName: string): boolean | null {
        return undefined;
    }

    getNullableByte(fieldName: string): number | null {
        return undefined;
    }

    getNullableDouble(fieldName: string): number | null {
        return undefined;
    }

    getNullableFloat(fieldName: string): number | null {
        return undefined;
    }

    getNullableInt(fieldName: string): number | null {
        return undefined;
    }

    getNullableLong(fieldName: string): Long | null {
        return undefined;
    }

    getNullableShort(fieldName: string): number | null {
        return undefined;
    }

    getSchema(): Schema {
        return undefined;
    }

    getShort(fieldName: string): number {
        return 0;
    }

    getString(fieldName: string): string {
        return '';
    }

    getTime(fieldName: string): LocalTime {
        return undefined;
    }

    getTimestamp(fieldName: string): LocalDateTime {
        return undefined;
    }

    getTimestampWithTimezone(fieldName: string): OffsetDateTime {
        return undefined;
    }

    hasField(fieldName: string): boolean {
        return false;
    }

    getObject<T>(fieldName: string): T {
        throw new Error('Method not implemented.');
    }
}
