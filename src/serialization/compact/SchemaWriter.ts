import {CompactWriter} from './CompactWriter';
import {Schema} from './Schema';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import * as Long from 'long';
import {FieldDescriptor} from '../generic_record/FieldDescriptor';
import {FieldKind} from '../generic_record/FieldKind';

export class SchemaWriter implements CompactWriter {
    private readonly typeName: string;
    private readonly fields: FieldDescriptor[];

    constructor(typeName: string) {
        this.typeName = typeName;
        this.fields = [];
    }

    addField(field: FieldDescriptor): void {
        this.fields.push(...arguments);
    }

    build() : Schema {
        return new Schema(this.typeName, this.fields);
    }

    writeArrayOfBoolean(fieldName: string, value: boolean[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_BOOLEANS));
    }

    writeArrayOfInt8(fieldName: string, value: Buffer | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_BYTES));
    }

    writeArrayOfCompact<T>(fieldName: string, value: T[] | null): Promise<void> {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_COMPACTS));
        return Promise.resolve();
    }

    writeArrayOfDate(fieldName: string, value: LocalDate[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DATES));
    }

    writeArrayOfDecimal(fieldName: string, value: BigDecimal[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DECIMALS));
    }

    writeArrayOfFloat64(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DOUBLES));
    }

    writeArrayOfFloat32(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_FLOATS));
    }

    writeArrayOfInt32(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INTS));
    }

    writeArrayOfInt64(fieldName: string, value: Long[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_LONGS));
    }

    writeArrayOfNullableBoolean(fieldName: string, value: (boolean | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEANS));
    }

    writeArrayOfNullableInt8(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_BYTES));
    }

    writeArrayOfNullableFloat64(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_DOUBLES));
    }

    writeArrayOfNullableFloat32(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOATS));
    }

    writeArrayOfNullableInt32(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INTS));
    }

    writeArrayOfNullableInt64(fieldName: string, value: (Long | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_LONGS));
    }

    writeArrayOfNullableInt16(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_SHORTS));
    }

    writeArrayOfInt16(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_SHORTS));
    }

    writeArrayOfString(fieldName: string, value: string[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_STRINGS));
    }

    writeArrayOfTime(fieldName: string, value: LocalTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMES));
    }

    writeArrayOfTimestampWithTimezone(fieldName: string, value: OffsetDateTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES));
    }

    writeArrayOfTimestamp(fieldName: string, value: LocalDateTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMESTAMPS));
    }

    writeBoolean(fieldName: string, value: boolean): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.BOOLEAN));
    }

    writeInt8(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.BYTE));
    }

    writeCompact<T>(fieldName: string, value: T | null): Promise<void> {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.COMPACT));
        return Promise.resolve();
    }

    writeDate(fieldName: string, value: LocalDate | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.DATE));
    }

    writeDecimal(fieldName: string, value: BigDecimal | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.DECIMAL));
    }

    writeFloat64(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.DOUBLE));
    }

    writeFloat32(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.FLOAT));
    }

    writeInt32(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT));
    }

    writeInt64(fieldName: string, value: Long): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.LONG));
    }

    writeNullableBoolean(fieldName: string, value: boolean | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_BOOLEAN));
    }

    writeNullableInt8(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_BYTE));
    }

    writeNullableFloat64(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_DOUBLE));
    }

    writeNullableFloat32(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_FLOAT));
    }

    writeNullableInt32(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT));
    }

    writeNullableInt64(fieldName: string, value: Long | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_LONG));
    }

    writeNullableInt16(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_SHORT));
    }

    writeInt16(fieldName: string, value: number): void {
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
