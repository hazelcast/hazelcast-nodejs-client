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
  SqlColumnType represents the datatype of a {@link SqlColumnMetadata}.
 */
export enum SqlColumnType {
    /** VARCHAR type, represented by `string`. */
    VARCHAR,
    /** BOOLEAN type, represented by `boolean`. */
    BOOLEAN,
    /** TINYINT type, represented by `number`. */
    TINYINT,
    /** SMALLINT type, represented by `number`. */
    SMALLINT,
    /** INTEGER type, represented by `number`. */
    INTEGER,
    /** BIGINT type, represented by [long](https://www.npmjs.com/package/long). */
    BIGINT,
    /** DECIMAL type, represented by `string`. */
    DECIMAL,
    /** REAL type, represented by `number`. */
    REAL,
    /** DOUBLE type, represented by `number`. */
    DOUBLE,
    /** DATE type, represented by {@link HzLocalDate}. */
    DATE,
    /** TIME type, represented by {@link HzLocalTime}. */
    TIME,
    /** TIMESTAMP type, represented by {@link HzLocalDateTime}. */
    TIMESTAMP,
    /** TIMESTAMP_WITH_TIME_ZONE type, represented by {@link HzOffsetDateTime}. */
    TIMESTAMP_WITH_TIME_ZONE,
    /** OBJECT type, could be represented by any class. */
    OBJECT,
    /**
     * The type of the generic SQL `NULL` literal.
     * The only valid value of `NULL` type is `null`.
     */
    NULL
}

/**
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
