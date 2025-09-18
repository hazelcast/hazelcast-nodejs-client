/// <reference types="node" />
import { FieldKind } from './FieldKind';
import * as Long from 'long';
import { BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime } from '../../core';
/**
 * A generic object interface that is returned to the user when the domain class can not be created from any of the distributed
 * Hazelcast data structures like {@link IMap}, {@link IQueue} etc.
 *
 * GenericRecord also allows reading from a cluster without having the classes on the client side.
 * This way, the clients can read and write objects back to the cluster without the need to have
 * the domain classes.
 *
 * GenericRecords is only supported for Compact serializable objects.
 *
 */
export interface GenericRecord {
    /**
     * Clones this generic record and returns a new one.
     * @param fieldsToUpdate If provided, some fields of the returned generic record will be updated. Keys of this object
     * are fieldNames and values are field values.
     * @throws TypeError if the type of any value does not match with its field type.
     * @throws RangeError if any provided fieldName does not exist in the record or a field value provided is out of range.
     */
    clone(fieldsToUpdate?: {
        [fieldName: string]: any;
    }): GenericRecord;
    /**
     * Returns set of field names of this GenericRecord
     */
    getFieldNames(): Set<string>;
    /**
     * Returns field type for the given field name
     *
     * @param fieldName the name of the field
     * @throws RangeError if the field name does not exist in the generic record
     */
    getFieldKind(fieldName: string): FieldKind;
    /**
     * Returns true if field exists in the definition of the class. Note that returns true even if the field is `null`.
     * @param fieldName the name of the field
     */
    hasField(fieldName: string): boolean;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getBoolean(fieldName: string): boolean;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getInt8(fieldName: string): number;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getInt16(fieldName: string): number;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getInt32(fieldName: string): number;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getInt64(fieldName: string): Long;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getFloat32(fieldName: string): number;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getFloat64(fieldName: string): number;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getString(fieldName: string): string | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getDecimal(fieldName: string): BigDecimal | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getTime(fieldName: string): LocalTime | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getDate(fieldName: string): LocalDate | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getTimestamp(fieldName: string): LocalDateTime | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getTimestampWithTimezone(fieldName: string): OffsetDateTime | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getGenericRecord(fieldName: string): GenericRecord | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfBoolean(fieldName: string): boolean[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfInt8(fieldName: string): Buffer | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfInt16(fieldName: string): number[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfInt32(fieldName: string): number[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfInt64(fieldName: string): Long[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfFloat32(fieldName: string): number[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfFloat64(fieldName: string): number[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfString(fieldName: string): (string | null)[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfDecimal(fieldName: string): (BigDecimal | null)[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfTime(fieldName: string): (LocalTime | null)[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfDate(fieldName: string): (LocalDate | null)[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfTimestamp(fieldName: string): (LocalDateTime | null)[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfTimestampWithTimezone(fieldName: string): (OffsetDateTime | null)[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfGenericRecord(fieldName: string): (GenericRecord | null)[] | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getNullableBoolean(fieldName: string): boolean | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getNullableInt8(fieldName: string): number | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getNullableInt16(fieldName: string): number | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getNullableInt32(fieldName: string): number | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getNullableInt64(fieldName: string): Long | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getNullableFloat32(fieldName: string): number | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getNullableFloat64(fieldName: string): number | null;
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfNullableBoolean(fieldName: string): (boolean | null)[];
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfNullableInt8(fieldName: string): (number | null)[];
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfNullableInt16(fieldName: string): (number | null)[];
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfNullableInt32(fieldName: string): (number | null)[];
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfNullableInt64(fieldName: string): (Long | null)[];
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfNullableFloat32(fieldName: string): (number | null)[];
    /**
     * Returns value of the field.
     * @param fieldName the name of the field
     * @throws {@link HazelcastSerializationError} if the field name does not exist in the generic record or
     * the type of the field does not match the one in the generic record.
     */
    getArrayOfNullableFloat64(fieldName: string): (number | null)[];
    /**
     * Returns string representation of this generic record. The string representation
     * is a valid JSON string.
     */
    toString(): string;
}
