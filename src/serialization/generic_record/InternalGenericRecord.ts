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

import {GenericRecord} from './GenericRecord';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import * as Long from 'long';

/**
 * @internal
 */
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
    getObjectFromArray(fieldName: string, index: number): any | null;
    getArrayOfObjects(fieldName: string): any[];
    getObject(fieldName: string): any;
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

