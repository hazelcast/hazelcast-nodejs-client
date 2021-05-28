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

/**
 ### SQL column type
 SqlColumnType represents the datatype of a {@link SqlColumnMetadata}. The classes corresponding to each of them in java
 and javascript are given below:

 | Column Type                  | Javascript                                 |
 |------------------------------|--------------------------------------------|
 | **VARCHAR**                  | `string`                                   |
 | **BOOLEAN**                  | `boolean`                                  |
 | **TINYINT**                  | `number`                                   |
 | **SMALLINT**                 | `number`                                   |
 | **INTEGER**                  | `number`                                   |
 | **BIGINT**                   | [long](https://www.npmjs.com/package/long) |
 | **DECIMAL**                  | `string`                                   |
 | **REAL**                     | `number`                                   |
 | **DOUBLE**                   | `number`                                   |
 | **DATE**                     | {@link HzLocalDate}                        |
 | **TIME**                     | {@link HzLocalTime}                        |
 | **TIMESTAMP**                | {@link HzLocalDateTime}                    |
 | **TIMESTAMP_WITH_TIME_ZONE** | {@link HzOffsetDateTime}                   |
 | **OBJECT**                   | Any class                                  |
 | **NULL**                     | `null`                                     |
 */
export enum SqlColumnType {
    VARCHAR,
    BOOLEAN,
    TINYINT,
    SMALLINT,
    INTEGER,
    BIGINT,
    DECIMAL,
    REAL,
    DOUBLE,
    DATE,
    TIME,
    TIMESTAMP,
    TIMESTAMP_WITH_TIME_ZONE,
    OBJECT,
    NULL
}

/**
 * ### SQL column metadata
 * Represents column metadata for SQL result.
 */
export interface SqlColumnMetadata {
    /** Column name. */
    name: string;

    /** Column type. */
    type: SqlColumnType;

    /** Column nullability. If true, the column values can be null. */
    nullable: boolean;
}

/** @internal */
export class SqlColumnMetadataImpl implements SqlColumnMetadata {
    public readonly name: string;
    public readonly type: SqlColumnType;
    public readonly nullable: boolean;

    constructor(
        name: string,
        type: SqlColumnType,
        isNullableExists: boolean,
        nullable: boolean
    ) {
        if (isNullableExists) {
            this.nullable = nullable;
        } else {
            this.nullable = true;
        }
        this.name = name;
        this.type = type;
    }
}
