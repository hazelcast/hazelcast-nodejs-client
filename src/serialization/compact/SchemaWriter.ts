import {CompactWriter} from './CompactWriter';
import {Schema} from './Schema';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import * as Long from 'long';
import {FieldDescriptor} from '../generic_record/FieldDescriptor';
import {FieldKind} from '../generic_record/FieldKind';

export class SchemaWriter implements CompactWriter {
    private readonly className: string;
    private readonly fields: FieldDescriptor[];

    constructor(className: string) {
        this.className = className;
        this.fields = [];
    }

    addField(field: FieldDescriptor): void {
        this.fields.push(...arguments);
    }

    build() : Schema {
        return new Schema(this.className, this.fields);
    }

    writeArrayOfBooleans(fieldName: string, value: boolean[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_BOOLEANS));
    }

    writeArrayOfBytes(fieldName: string, value: Buffer | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_BYTES));
    }

    writeArrayOfCompacts<T>(fieldName: string, value: T[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_COMPACTS));
    }

    writeArrayOfDates(fieldName: string, value: LocalDate[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DATES));
    }

    writeArrayOfDecimals(fieldName: string, value: BigDecimal[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DECIMALS));
    }

    writeArrayOfDoubles(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DOUBLES));
    }

    writeArrayOfFloats(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_FLOATS));
    }

    writeArrayOfInts(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INTS));
    }

    writeArrayOfLongs(fieldName: string, value: Long[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_LONGS));
    }

    writeArrayOfNullableBooleans(fieldName: string, value: (boolean | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEANS));
    }

    writeArrayOfNullableBytes(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_BYTES));
    }

    writeArrayOfNullableDoubles(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_DOUBLES));
    }

    writeArrayOfNullableFloats(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOATS));
    }

    writeArrayOfNullableInts(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INTS));
    }

    writeArrayOfNullableLongs(fieldName: string, value: (Long | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_LONGS));
    }

    writeArrayOfNullableShorts(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_SHORTS));
    }

    writeArrayOfShorts(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_SHORTS));
    }

    writeArrayOfStrings(fieldName: string, value: string[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_STRINGS));
    }

    writeArrayOfTimes(fieldName: string, value: LocalTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMES));
    }

    writeArrayOfTimestampWithTimezones(fieldName: string, value: OffsetDateTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES));
    }

    writeArrayOfTimestamps(fieldName: string, value: LocalDateTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMESTAMPS));
    }

    writeBoolean(fieldName: string, value: boolean): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.BOOLEAN));
    }

    writeByte(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.BYTE));
    }

    writeCompact<T>(fieldName: string, value: T | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.COMPACT));
    }

    writeDate(fieldName: string, value: LocalDate | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.DATE));
    }

    writeDecimal(fieldName: string, value: BigDecimal | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.DECIMAL));
    }

    writeDouble(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.DOUBLE));
    }

    writeFloat(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.FLOAT));
    }

    writeInt(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT));
    }

    writeLong(fieldName: string, value: Long): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.LONG));
    }

    writeNullableBoolean(fieldName: string, value: boolean | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_BOOLEAN));
    }

    writeNullableByte(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_BYTE));
    }

    writeNullableDouble(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_DOUBLE));
    }

    writeNullableFloat(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_FLOAT));
    }

    writeNullableInt(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT));
    }

    writeNullableLong(fieldName: string, value: Long | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_LONG));
    }

    writeNullableShort(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_SHORT));
    }

    writeShort(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.SHORT));
    }

    writeString(fieldName: string, value: string | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.STRING));
    }

    writeTime(fieldName: string, value: LocalTime | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.TIME));
    }

    writeTimestamp(fieldName: string, value: LocalDateTime | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.TIMESTAMP));
    }

    writeTimestampWithTimezone(fieldName: string, value: OffsetDateTime | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.TIMESTAMP_WITH_TIMEZONE));
    }
}
