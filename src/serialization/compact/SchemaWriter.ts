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
        return new Schema(this.typeName, this.fields.sort((field1, field2) => {
            if (field1 === field2) {
                return 0;
            }
            return field1.fieldName > field2.fieldName ? 1 : -1;
        }));
    }

    writeArrayOfBoolean(fieldName: string, value: boolean[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_BOOLEAN));
    }

    writeArrayOfInt8(fieldName: string, value: Buffer | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INT8));
    }

    writeArrayOfCompact<T>(fieldName: string, value: T[] | null): Promise<void> {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_COMPACT));
        return Promise.resolve();
    }

    writeArrayOfDate(fieldName: string, value: LocalDate[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DATE));
    }

    writeArrayOfDecimal(fieldName: string, value: BigDecimal[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DECIMAL));
    }

    writeArrayOfFloat64(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_FLOAT64));
    }

    writeArrayOfFloat32(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_FLOAT32));
    }

    writeArrayOfInt32(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INT32));
    }

    writeArrayOfInt64(fieldName: string, value: Long[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INT64));
    }

    writeArrayOfNullableBoolean(fieldName: string, value: (boolean | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN));
    }

    writeArrayOfNullableInt8(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT8));
    }

    writeArrayOfNullableFloat64(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT64));
    }

    writeArrayOfNullableFloat32(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT32));
    }

    writeArrayOfNullableInt32(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT32));
    }

    writeArrayOfNullableInt64(fieldName: string, value: (Long | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT64));
    }

    writeArrayOfNullableInt16(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT16));
    }

    writeArrayOfInt16(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INT16));
    }

    writeArrayOfString(fieldName: string, value: string[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_STRING));
    }

    writeArrayOfTime(fieldName: string, value: LocalTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIME));
    }

    writeArrayOfTimestampWithTimezone(fieldName: string, value: OffsetDateTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE));
    }

    writeArrayOfTimestamp(fieldName: string, value: LocalDateTime[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMESTAMP));
    }

    writeBoolean(fieldName: string, value: boolean): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.BOOLEAN));
    }

    writeInt8(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT8));
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
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.FLOAT64));
    }

    writeFloat32(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.FLOAT32));
    }

    writeInt32(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT32));
    }

    writeInt64(fieldName: string, value: Long): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT64));
    }

    writeNullableBoolean(fieldName: string, value: boolean | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_BOOLEAN));
    }

    writeNullableInt8(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT8));
    }

    writeNullableFloat64(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_FLOAT64));
    }

    writeNullableFloat32(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_FLOAT32));
    }

    writeNullableInt32(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT32));
    }

    writeNullableInt64(fieldName: string, value: Long | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT64));
    }

    writeNullableInt16(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT16));
    }

    writeInt16(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT16));
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
