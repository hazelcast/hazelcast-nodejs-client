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
import {Nullable} from './Field';

/**
 * @internal
 */
export interface InternalGenericRecord extends GenericRecord {
    getBooleanFromArray(fieldName: string, index: number): Nullable<boolean>;
    getByteFromArray(fieldName: string, index: number): Nullable<number>;
    getCharFromArray(fieldName: string, index: number): Nullable<string>;
    getShortFromArray(fieldName: string, index: number): Nullable<number>;
    getIntFromArray(fieldName: string, index: number): Nullable<number>;
    getLongFromArray(fieldName: string, index: number): Nullable<Long>;
    getFloatFromArray(fieldName: string, index: number): Nullable<number>;
    getDoubleFromArray(fieldName: string, index: number): Nullable<number>;
    getStringFromArray(fieldName: string, index: number): Nullable<string>;
    getGenericRecordFromArray(fieldName: string, index: number): Nullable<GenericRecord>;
    getObjectFromArray(fieldName: string, index: number): Nullable<any>;
    getArrayOfObjects(fieldName: string): any[];
    getObject(fieldName: string): any;
    getDecimalFromArray(fieldName: string, index: number): Nullable<BigDecimal>;
    getTimeFromArray(fieldName: string, index: number): Nullable<LocalTime>;
    getDateFromArray(fieldName: string, index: number): Nullable<LocalDate>;
    getTimestampFromArray(fieldName: string, index: number): Nullable<LocalDateTime>;
    getTimestampWithTimezoneFromArray(fieldName: string, index: number): Nullable<OffsetDateTime>;
    getNullableBooleanFromArray(fieldName: string, index: number): Nullable<boolean>;
    getNullableByteFromArray(fieldName: string, index: number): Nullable<number>;
    getNullableShortFromArray(fieldName: string, index: number): Nullable<number>;
    getNullableIntFromArray(fieldName: string, index: number): Nullable<number>;
    getNullableLongFromArray(fieldName: string, index: number): Nullable<Long>;
    getNullableFloatFromArray(fieldName: string, index: number): Nullable<number>;
    getNullableDoubleFromArray(fieldName: string, index: number): Nullable<number>;
}

