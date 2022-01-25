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

export const FIELD_KIND_COUNT = 46;

export enum FieldKind {
    BOOLEAN,
    ARRAY_OF_BOOLEAN,
    INT8,
    ARRAY_OF_INT8,
    CHAR,
    ARRAY_OF_CHAR,
    INT16,
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
    PORTABLE,
    ARRAY_OF_PORTABLE,
    NULLABLE_BOOLEAN,
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
}
