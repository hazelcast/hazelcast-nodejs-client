/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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

/**
 * FieldKind for Compact.
 * It is designed to be used with {@link GenericRecord.getFieldKind} API.
 *
 * Note that actual ids in {@link FieldType} and {@link FieldKind} are not matching.
 * {@link FieldType} is the old API for Portable only and only meant to be used with
 * {@link PortableReader.getFieldType} API.
 *
 */
 export enum FieldKind {
    /**
     * Represents fields that do not exist.
     */
    NOT_AVAILABLE = 0,
    BOOLEAN = 1,
    ARRAY_OF_BOOLEAN = 2,
    INT8 = 3,
    ARRAY_OF_INT8 = 4,
    // char and array of char are not here because portable generic records is not supported yet
    // CHAR = 5,
    // ARRAY_OF_CHAR = 6,
    INT16 = 7,
    ARRAY_OF_INT16 = 8,
    INT32 = 9,
    ARRAY_OF_INT32 = 10,
    INT64 = 11,
    ARRAY_OF_INT64 = 12,
    FLOAT32 = 13,
    ARRAY_OF_FLOAT32 = 14,
    FLOAT64 = 15,
    ARRAY_OF_FLOAT64 = 16,
    STRING = 17,
    ARRAY_OF_STRING = 18,
    DECIMAL = 19,
    ARRAY_OF_DECIMAL = 20,
    TIME = 21,
    ARRAY_OF_TIME = 22,
    DATE = 23,
    ARRAY_OF_DATE = 24,
    TIMESTAMP = 25,
    ARRAY_OF_TIMESTAMP = 26,
    TIMESTAMP_WITH_TIMEZONE = 27,
    ARRAY_OF_TIMESTAMP_WITH_TIMEZONE = 28,
    COMPACT = 29,
    ARRAY_OF_COMPACT = 30,
    // portable and array of portable are not here because portable generic records is not supported yet
    // PORTABLE = 31,
    // ARRAY_OF_PORTABLE = 32,
    NULLABLE_BOOLEAN = 33,
    ARRAY_OF_NULLABLE_BOOLEAN = 34,
    NULLABLE_INT8 = 35,
    ARRAY_OF_NULLABLE_INT8 = 36,
    NULLABLE_INT16 = 37,
    ARRAY_OF_NULLABLE_INT16 = 38,
    NULLABLE_INT32 = 39,
    ARRAY_OF_NULLABLE_INT32 = 40,
    NULLABLE_INT64 = 41,
    ARRAY_OF_NULLABLE_INT64 = 42,
    NULLABLE_FLOAT32 = 43,
    ARRAY_OF_NULLABLE_FLOAT32 = 44,
    NULLABLE_FLOAT64 = 45,
    ARRAY_OF_NULLABLE_FLOAT64 = 46,
}
