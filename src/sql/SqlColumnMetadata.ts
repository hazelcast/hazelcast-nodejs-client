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

export enum SqlColumnType {
    VARCHAR = 0,
    BOOLEAN = 1,
    TINYINT = 2,
    SMALLINT = 3,
    INTEGER = 4,
    BIGINT = 5,
    DECIMAL = 6,
    REAL = 7,
    DOUBLE = 8,
    DATE = 9,
    TIME = 10,
    TIMESTAMP = 11,
    TIMESTAMP_WITH_TIME_ZONE = 12,
    OBJECT = 13,
    NULL = 14
}


export interface SqlColumnMetadata {
    // Get column name.
    getName(): string;

    // Gets column type.
    getType(): SqlColumnType;

    // Gets column nullability.
    isNullable(): boolean;
}
