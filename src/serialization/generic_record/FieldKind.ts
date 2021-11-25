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
    ARRAY_OF_BOOLEANS,
    BYTE,
    ARRAY_OF_BYTES,
    CHAR,
    ARRAY_OF_CHARS,
    SHORT,
    ARRAY_OF_SHORTS,
    INT,
    ARRAY_OF_INTS,
    LONG,
    ARRAY_OF_LONGS,
    FLOAT,
    ARRAY_OF_FLOATS,
    DOUBLE,
    ARRAY_OF_DOUBLES,
    STRING,
    ARRAY_OF_STRINGS,
    DECIMAL,
    ARRAY_OF_DECIMALS,
    TIME,
    ARRAY_OF_TIMES,
    DATE,
    ARRAY_OF_DATES,
    TIMESTAMP,
    ARRAY_OF_TIMESTAMPS,
    TIMESTAMP_WITH_TIMEZONE,
    ARRAY_OF_TIMESTAMP_WITH_TIMEZONES,
    COMPACT,
    ARRAY_OF_COMPACTS,
    PORTABLE,
    ARRAY_OF_PORTABLES,
    NULLABLE_BOOLEAN,
    ARRAY_OF_NULLABLE_BOOLEANS,
    NULLABLE_BYTE,
    ARRAY_OF_NULLABLE_BYTES,
    NULLABLE_SHORT,
    ARRAY_OF_NULLABLE_SHORTS,
    NULLABLE_INT,
    ARRAY_OF_NULLABLE_INTS,
    NULLABLE_LONG,
    ARRAY_OF_NULLABLE_LONGS,
    NULLABLE_FLOAT,
    ARRAY_OF_NULLABLE_FLOATS,
    NULLABLE_DOUBLE,
    ARRAY_OF_NULLABLE_DOUBLES,
    GENERIC_RECORD,
    ARRAY_OF_GENERIC_RECORDS,
}
