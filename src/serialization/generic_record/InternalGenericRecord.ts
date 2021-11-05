import {GenericRecord} from './GenericRecord';
import * as Long from 'long';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';

export interface InternalGenericRecord extends GenericRecord {
    getBooleanFromArray(fieldName: string, index: number): boolean | null;
    getByteFromArray(fieldName: string, index: number): number | null;
    getCharFromArray(fieldName: string, index: number): string | null;
    getShortFromArray(fieldName: string, index: number): number | null;
    getIntFromArray(fieldName: string, index: number): number | null;
    getLongFromArray(fieldName: string, index: number): Long | null;
    getFloatFromArray(fieldName: string, index: number): number | null;
    getDoubleFromArray(fieldName: string, index: number): number | null;
    getStringFromArray(fieldName: string, index: number): string | null;
    getGenericRecordFromArray(fieldName: string, index: number): GenericRecord | null;
    getObjectFromArray<T>(fieldName: string, index: number): T | null;
    getArrayOfObjects<T>(fieldName: string, componentType: new() => T): T[];
    getObject<T>(fieldName: string): T;
    getDecimalFromArray(fieldName: string, index: number): BigDecimal | null;
    getTimeFromArray(fieldName: string, index: number): LocalTime | null;
    getDateFromArray(fieldName: string, index: number): LocalDate | null;
    getTimestampFromArray(fieldName: string, index: number): LocalDateTime | null;
    getTimestampWithTimezoneFromArray(fieldName: string, index: number): OffsetDateTime | null;
    getNullableBooleanFromArray(fieldName: string, index: number): boolean | null;
    getNullableByteFromArray(fieldName: string, index: number): number | null;
    getNullableShortFromArray(fieldName: string, index: number): number | null;
    getNullableIntFromArray(fieldName: string, index: number): number | null;
    getNullableLongFromArray(fieldName: string, index: number): Long | null;
    getNullableFloatFromArray(fieldName: string, index: number): number | null;
    getNullableDoubleFromArray(fieldName: string, index: number): number | null;
}
