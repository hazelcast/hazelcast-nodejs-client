/// <reference types="node" />
import * as Long from 'long';
import { BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime } from '../core';
/**
 * Portable field type.
 */
export declare enum FieldType {
    PORTABLE = 0,
    BYTE = 1,
    BOOLEAN = 2,
    CHAR = 3,
    SHORT = 4,
    INT = 5,
    LONG = 6,
    FLOAT = 7,
    DOUBLE = 8,
    UTF = 9,
    STRING = 9,
    PORTABLE_ARRAY = 10,
    BYTE_ARRAY = 11,
    BOOLEAN_ARRAY = 12,
    CHAR_ARRAY = 13,
    SHORT_ARRAY = 14,
    INT_ARRAY = 15,
    LONG_ARRAY = 16,
    FLOAT_ARRAY = 17,
    DOUBLE_ARRAY = 18,
    UTF_ARRAY = 19,
    STRING_ARRAY = 19,
    DECIMAL = 20,
    DECIMAL_ARRAY = 21,
    TIME = 22,
    TIME_ARRAY = 23,
    DATE = 24,
    DATE_ARRAY = 25,
    TIMESTAMP = 26,
    TIMESTAMP_ARRAY = 27,
    TIMESTAMP_WITH_TIMEZONE = 28,
    TIMESTAMP_WITH_TIMEZONE_ARRAY = 29
}
/**
 * Writer helper for {@link Portable} objects.
 */
export interface PortableWriter {
    /**
     * Writes a number as 32-bit signed integer.
     *
     * @param fieldName name of the field
     * @param value     int value to be written. The value must be a valid signed 32-bit integer.
     * Behavior is undefined when value is anything other than a signed 32-bit integer.
     */
    writeInt(fieldName: string, value: number): void;
    /**
     * Writes a long.
     *
     * @param fieldName name of the field
     * @param value     long value to be written
     */
    writeLong(fieldName: string, value: Long): void;
    /**
     * Writes a string as UTF-8 encoded bytes.
     *
     * @param fieldName name of the field
     * @param value     UTF string value to be written
     * @deprecated since version 4.2 for the sake of better naming. Please use {@link writeString} instead.
     */
    writeUTF(fieldName: string, value: string | null): void;
    /**
     * Writes a string as UTF-8 encoded bytes.
     *
     * @param fieldName name of the field
     * @param value     UTF string value to be written
     */
    writeString(fieldName: string, value: string | null): void;
    /**
     * Writes a primitive boolean.
     *
     * @param fieldName name of the field
     * @param value     boolean value to be written
     */
    writeBoolean(fieldName: string, value: boolean): void;
    /**
     * Writes a number as 8-bit unsigned integer.
     *
     * @param fieldName name of the field
     * @param value     byte value to be written. Must be a valid unsigned 8-bit integer.
     * Behaviour is undefined when value is anything other than a unsigned 8-bit integer.
     */
    writeByte(fieldName: string, value: number): void;
    /**
     * Writes a single character string using `char.charCodeAt(0)`.
     *
     * A two-byte unsigned integer representing the UTF-16
     * code unit value of the single character string will be written.
     *
     * @param fieldName name of the field
     * @param value     char value to be written
     */
    writeChar(fieldName: string, value: string): void;
    /**
     * Writes a number as double.
     *
     * @param fieldName name of the field
     * @param value     double value to be written. The value must be a JavaScript number.
     * Behavior is undefined when value is anything other than a JavaScript number.
     */
    writeDouble(fieldName: string, value: number): void;
    /**
     * Writes a number as float.
     *
     * @param fieldName name of the field
     * @param value     float value to be written. The value must be a JavaScript number.
     * Behavior is undefined when value is anything other than a JavaScript number.
     */
    writeFloat(fieldName: string, value: number): void;
    /**
     * Writes a number as 16-bit signed integer.
     *
     * @param fieldName name of the field
     * @param value     short value to be written. The value must be a valid signed 16-bit integer.
     * Behavior is undefined when value is anything other than an signed 16-bit integer.
     */
    writeShort(fieldName: string, value: number): void;
    /**
     * Writes a Portable.
     * Use {@link writeNullPortable} to write a `null` Portable
     *
     * @param fieldName name of the field
     * @param Portable  Portable to be written
     */
    writePortable(fieldName: string, Portable: Portable | null): void;
    /**
     * To write a `null` Portable value, you need to provide class and factory IDs of the related class.
     *
     * @param fieldName name of the field
     * @param factoryId factory ID of related Portable class
     * @param classId   class ID of related Portable class
     */
    writeNullPortable(fieldName: string, factoryId: number, classId: number): void;
    /**
     * Writes a decimal.
     *
     * @param fieldName name of the field
     * @param value     BigDecimal value to be written
     */
    writeDecimal(fieldName: string, value: BigDecimal | null): void;
    /**
     * Write a time.
     *
     * @param fieldName name of the field
     * @param value     LocalTime value to be written
     */
    writeTime(fieldName: string, value: LocalTime | null): void;
    /**
     * Writes a date.
     *
     * @param fieldName name of the field
     * @param value     LocalDate value to be written
     */
    writeDate(fieldName: string, value: LocalDate | null): void;
    /**
     * Writes a timestamp.
     *
     * @param fieldName name of the field
     * @param value     LocalDateTime value to be written
     */
    writeTimestamp(fieldName: string, value: LocalDateTime | null): void;
    /**
     * Writes a timestamp with timezone.
     *
     * @param fieldName name of the field
     * @param value     OffsetDateTime value to be written
     */
    writeTimestampWithTimezone(fieldName: string, value: OffsetDateTime | null): void;
    /**
     * Writes a Buffer as byte array.
     *
     * @param fieldName name of the field
     * @param bytes     Buffer to be written
     */
    writeByteArray(fieldName: string, bytes: Buffer | null): void;
    /**
     * Writes an array of primitive booleans.
     *
     * @param fieldName name of the field
     * @param booleans  boolean array to be written
     */
    writeBooleanArray(fieldName: string, booleans: boolean[] | null): void;
    /**
     * Writes an array of single character strings using `char.charCodeAt(0)`.
     *
     * For each single character string, a two-byte unsigned integer
     * representing the UTF-16 code unit value will be written.
     *
     * @param fieldName name of the field
     * @param chars     char array to be written
     */
    writeCharArray(fieldName: string, chars: string[] | null): void;
    /**
     * Writes an array of numbers as 32-bit signed integer array.
     *
     * @param fieldName name of the field
     * @param ints      int array to be written. Each value must be a valid signed 32-bit integer.
     * Behavior is undefined when any value is anything other than a signed 32-bit integer.
     */
    writeIntArray(fieldName: string, ints: number[] | null): void;
    /**
     * Writes an array of longs.
     *
     * @param fieldName name of the field
     * @param longs     long array to be written
     */
    writeLongArray(fieldName: string, longs: Long[] | null): void;
    /**
     * Writes an array of numbers as doubles.
     *
     * @param fieldName name of the field
     * @param values    double array to be written. Each value must be a JavaScript number.
     * Behavior is undefined when any value is anything other than a JavaScript number.
     */
    writeDoubleArray(fieldName: string, values: number[] | null): void;
    /**
     * Writes an array of numbers as floats.
     *
     * @param fieldName name of the field
     * @param values    float array to be written. Each value must be a JavaScript number.
     * Behavior is undefined when any value is anything other than a JavaScript number.
     */
    writeFloatArray(fieldName: string, values: number[] | null): void;
    /**
     * Writes an array of numbers as 16-bit signed integers.
     *
     * @param fieldName name of the field
     * @param values    short array to be written. Each value must be a valid signed 16-bit integer.
     * Behavior is undefined when any value is anything other than a signed 16-bit integer.
     */
    writeShortArray(fieldName: string, values: number[] | null): void;
    /**
     * Writes an array of strings. Each string is written as UTF-8 encoded bytes.
     *
     * @param fieldName name of the field
     * @param values    string array to be written
     * @deprecated  since version 4.2. for the sake of better naming. Please use {@link writeStringArray} instead.
     */
    writeUTFArray(fieldName: string, values: string[] | null): void;
    /**
     * Writes an array of strings. Each string is written as UTF-8 encoded bytes.
     *
     * @param fieldName name of the field
     * @param values    string array to be written
     */
    writeStringArray(fieldName: string, values: string[] | null): void;
    /**
     * Writes an array Portables.
     *
     * @param fieldName name of the field
     * @param values    Portable array to be written
     */
    writePortableArray(fieldName: string, values: Portable[] | null): void;
    /**
     * Writes an array of `BigDecimal`s.
     *
     * @param fieldName name of the field
     * @param values    BigDecimal array to be written
     * @see {@link writeDecimal}
     */
    writeDecimalArray(fieldName: string, values: BigDecimal[] | null): void;
    /**
     * Writes an array of `LocalTime`s.
     *
     * @param fieldName name of the field
     * @param values    LocalTime array to be written
     * @see {@link writeTime}
     */
    writeTimeArray(fieldName: string, values: LocalTime[] | null): void;
    /**
     * Writes an array of `LocalDate`s.
     *
     * @param fieldName name of the field
     * @param values    LocalDate array to be written
     * @see {@link writeDate}
     */
    writeDateArray(fieldName: string, values: LocalDate[] | null): void;
    /**
     * Writes an array of `LocalDateTime`s.
     *
     * @param fieldName name of the field
     * @param values    LocalDateTime array to be written
     * @see {@link writeTimestamp}
     */
    writeTimestampArray(fieldName: string, values: LocalDateTime[] | null): void;
    /**
     * Writes an array of `OffsetDateTime`s.
     *
     * @param fieldName name of the field
     * @param values    OffsetDateTime array to be written
     * @see {@link writeTimestampWithTimezone}
     */
    writeTimestampWithTimezoneArray(fieldName: string, values: OffsetDateTime[] | null): void;
}
/**
 * Reader helper for {@link Portable} objects.
 */
export interface PortableReader {
    /**
     * @return global version of Portable classes
     */
    getVersion(): number;
    /**
     * @param fieldName name of the field (does not support nested paths)
     * @return true if field exist in this class.
     */
    hasField(fieldName: string): boolean;
    /**
     * @return set of field names on this Portable class
     */
    getFieldNames(): string[];
    /**
     * @param fieldName name of the field
     * @return field type of given fieldName
     * @throws RangeError if the field does not exist.
     */
    getFieldType(fieldName: string): FieldType;
    /**
     * Reads a 32-bit signed integer.
     *
     * @param fieldName name of the field
     * @return the int value read
     */
    readInt(fieldName: string): number;
    /**
     * Reads a long.
     *
     * @param fieldName name of the field
     * @return the long value read
     */
    readLong(fieldName: string): Long;
    /**
     * Reads a string from UTF-8 encoded bytes.
     *
     * @param fieldName name of the field
     * @return the UTF string value read
     * @deprecated since version 4.2 for the sake of better naming. Please use {@link readString} instead.
     */
    readUTF(fieldName: string): string | null;
    /**
     * Reads a string from UTF-8 encoded bytes.
     *
     * @param fieldName name of the field
     * @return the string value read
     */
    readString(fieldName: string): string | null;
    /**
     * Reads a primitive boolean.
     *
     * @param fieldName name of the field
     * @return the boolean value read
     */
    readBoolean(fieldName: string): boolean;
    /**
     * Reads a 8-bit unsigned integer.
     *
     * @param fieldName name of the field
     * @return the byte value read
     */
    readByte(fieldName: string): number;
    /**
     * Reads a single character string using `String.fromCharCode` from two bytes of UTF-16 code units.
     *
     * @param fieldName name of the field
     * @return the char value read
     */
    readChar(fieldName: string): string;
    /**
     * Reads a double.
     *
     * @param fieldName name of the field
     * @return the double value read
     */
    readDouble(fieldName: string): number;
    /**
     * Reads a float.
     *
     * @param fieldName name of the field
     * @return the float value read
     */
    readFloat(fieldName: string): number;
    /**
     * Reads a 16-bit signed integer.
     *
     * @param fieldName name of the field
     * @return the short value read
     */
    readShort(fieldName: string): number;
    /**
     * Reads a Portable.
     *
     * @param fieldName name of the field
     * @return the Portable value read
     */
    readPortable(fieldName: string): Portable | null;
    /**
     * Reads a decimal.
     *
     * @param fieldName name of the field
     * @return the BigDecimal value read
     */
    readDecimal(fieldName: string): BigDecimal | null;
    /**
     * Reads a time.
     *
     * @param fieldName name of the field
     * @return the LocalTime value read
     */
    readTime(fieldName: string): LocalTime | null;
    /**
     * Reads a date.
     *
     * @param fieldName name of the field
     * @return the LocalDate value read
     */
    readDate(fieldName: string): LocalDate | null;
    /**
     * Reads a timestamp.
     *
     * @param fieldName name of the field
     * @return the LocalDateTime value read
     */
    readTimestamp(fieldName: string): LocalDateTime | null;
    /**
     * Reads a timestamp with timezone.
     *
     * @param fieldName name of the field
     * @return the OffsetDateTime value read
     */
    readTimestampWithTimezone(fieldName: string): OffsetDateTime | null;
    /**
     * Reads an array of bytes.
     *
     * @param fieldName name of the field
     * @return the byte array value read
     */
    readByteArray(fieldName: string): Buffer | null;
    /**
     * Reads an array of primitive booleans.
     *
     * @param fieldName name of the field
     * @return the boolean array value read
     */
    readBooleanArray(fieldName: string): boolean[] | null;
    /**
     * Reads an array of single character strings.
     * Each of them are read using `String.fromCharCode` from a two bytes UTF-16 code units.
     *
     * @param fieldName name of the field
     * @return the char array value read
     */
    readCharArray(fieldName: string): string[] | null;
    /**
     * Reads an array of 32-bit signed integers.
     *
     * @param fieldName name of the field
     * @return the int array value read
     */
    readIntArray(fieldName: string): number[] | null;
    /**
     * Reads an array of longs.
     *
     * @param fieldName name of the field
     * @return the long array value read
     */
    readLongArray(fieldName: string): Long[] | null;
    /**
     * Reads an array of doubles.
     *
     * @param fieldName name of the field
     * @return the double array value read
     */
    readDoubleArray(fieldName: string): number[] | null;
    /**
     * Reads an array of floats.
     *
     * @param fieldName name of the field
     * @return the float array value read
     */
    readFloatArray(fieldName: string): number[] | null;
    /**
     * Reads an array of 16-bit signed integers.
     *
     * @param fieldName name of the field
     * @return the short array value read
     */
    readShortArray(fieldName: string): number[] | null;
    /**
     * Reads an array strings. Strings are read using UTF-8 encoding.
     *
     * @param fieldName name of the field
     * @return the string array value read
     * @deprecated since version 4.2 for the sake of better naming. Please use {@link readStringArray} instead
     */
    readUTFArray(fieldName: string): string[] | null;
    /**
     * Reads an array of strings. Strings are read using UTF-8 encoding.
     *
     * @param fieldName name of the field
     * @return the string array value read
     */
    readStringArray(fieldName: string): string[] | null;
    /**
     * Reads an array of Portables.
     *
     * @param fieldName name of the field
     * @return the Portable array read
     */
    readPortableArray(fieldName: string): Portable[] | null;
    /**
     * Reads an array of `BigDecimal`s.
     *
     * @param fieldName name of the field
     * @return the BigDecimal array read
     * @see {@link readDecimal}
     */
    readDecimalArray(fieldName: string): BigDecimal[] | null;
    /**
     * Reads an array of `LocalTime`s.
     *
     * @param fieldName name of the field
     * @return the LocalTime array read
     * @see {@link readTime}
     */
    readTimeArray(fieldName: string): LocalTime[] | null;
    /**
     * Reads an array of `LocalDate`s.
     *
     * @param fieldName name of the field
     * @return the LocalDate array read
     * @see {@link readDate}
     */
    readDateArray(fieldName: string): LocalDate[] | null;
    /**
     * Reads an array of `LocalDateTime`s.
     *
     * @param fieldName name of the field
     * @return the LocalDateTime array read
     * @see {@link readTimestamp}
     */
    readTimestampArray(fieldName: string): LocalDateTime[] | null;
    /**
     * Reads an array of `OffsetDateTime`s.
     *
     * @param fieldName name of the field
     * @return the OffsetDateTime array read
     * @see {@link readTimestampWithTimezone}
     */
    readTimestampWithTimezoneArray(fieldName: string): OffsetDateTime[] | null;
}
/**
 * Interface for objects with Portable serialization support.
 */
export interface Portable {
    /**
     * Factory id of the Portable object.
     */
    factoryId: number;
    /**
     * Class id of the Portable object.
     */
    classId: number;
    /**
     * Reads fields of the Portable object from the binary representation.
     *
     * @param reader read helper
     */
    readPortable(reader: PortableReader): void;
    /**
     * Writes fields of the Portable object into the binary representation.
     *
     * @param writer write helper
     */
    writePortable(writer: PortableWriter): void;
}
/**
 * Interface for Portable serialization with multiversion support.
 */
export interface VersionedPortable extends Portable {
    /**
     * Version of the Portable object.
     */
    version: number;
}
/**
 * Factory function for {@link Portable}. Should return
 * an instance of the right {@link Portable} object, given
 * the matching `classId`.
 *
 * @param classId class id
 * @returns object for further initialization
 */
export declare type PortableFactory = (classId: number) => Portable;
