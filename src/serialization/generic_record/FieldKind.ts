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
 * This API is currently in Beta and can change at any time.
 */
export enum FieldKind {
    BOOLEAN,
    ARRAY_OF_BOOLEAN,
    INT8,
    ARRAY_OF_INT8,
    // char and array of char are not here because portable generic records is not supported yet
    // CHAR,
    // ARRAY_OF_CHAR,
    INT16 = 6,
    ARRAY_OF_INT16,
    INT32,
    ARRAY_OF_INT32,
    INT64,
    ARRAY_OF_INT64,
    FLOAT32,
    ARRAY_OF_FLOAT32,
    FLOAT64,
    ARRAY_OF_FLOAT64,
    STRING,
    ARRAY_OF_STRING,
    DECIMAL,
    ARRAY_OF_DECIMAL,
    TIME,
    ARRAY_OF_TIME,
    DATE,
    ARRAY_OF_DATE,
    TIMESTAMP,
    ARRAY_OF_TIMESTAMP,
    TIMESTAMP_WITH_TIMEZONE,
    ARRAY_OF_TIMESTAMP_WITH_TIMEZONE,
    COMPACT,
    ARRAY_OF_COMPACT,
    // portable and array of portable are not here because portable generic records is not supported yet
    // PORTABLE,
    // ARRAY_OF_PORTABLE,
    NULLABLE_BOOLEAN = 32,
    ARRAY_OF_NULLABLE_BOOLEAN,
    NULLABLE_INT8,
    ARRAY_OF_NULLABLE_INT8,
    NULLABLE_INT16,
    ARRAY_OF_NULLABLE_INT16,
    NULLABLE_INT32,
    ARRAY_OF_NULLABLE_INT32,
    NULLABLE_INT64,
    ARRAY_OF_NULLABLE_INT64,
    NULLABLE_FLOAT32,
    ARRAY_OF_NULLABLE_FLOAT32,
    NULLABLE_FLOAT64,
    ARRAY_OF_NULLABLE_FLOAT64,
    NOT_AVAILABLE,
}
