"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlColumnMetadataImpl = exports.SqlColumnType = void 0;
/**
  SqlColumnType represents the datatype of a {@link SqlColumnMetadata}.
 */
var SqlColumnType;
(function (SqlColumnType) {
    /** VARCHAR type, represented by `string`. */
    SqlColumnType[SqlColumnType["VARCHAR"] = 0] = "VARCHAR";
    /** BOOLEAN type, represented by `boolean`. */
    SqlColumnType[SqlColumnType["BOOLEAN"] = 1] = "BOOLEAN";
    /** TINYINT type, represented by `number`. */
    SqlColumnType[SqlColumnType["TINYINT"] = 2] = "TINYINT";
    /** SMALLINT type, represented by `number`. */
    SqlColumnType[SqlColumnType["SMALLINT"] = 3] = "SMALLINT";
    /** INTEGER type, represented by `number`. */
    SqlColumnType[SqlColumnType["INTEGER"] = 4] = "INTEGER";
    /** BIGINT type, represented by [long](https://www.npmjs.com/package/long). */
    SqlColumnType[SqlColumnType["BIGINT"] = 5] = "BIGINT";
    /** DECIMAL type, represented by {@link BigDecimal}. */
    SqlColumnType[SqlColumnType["DECIMAL"] = 6] = "DECIMAL";
    /** REAL type, represented by `number`. */
    SqlColumnType[SqlColumnType["REAL"] = 7] = "REAL";
    /** DOUBLE type, represented by `number`. */
    SqlColumnType[SqlColumnType["DOUBLE"] = 8] = "DOUBLE";
    /** DATE type, represented by {@link LocalDate}. */
    SqlColumnType[SqlColumnType["DATE"] = 9] = "DATE";
    /** TIME type, represented by {@link LocalTime}. */
    SqlColumnType[SqlColumnType["TIME"] = 10] = "TIME";
    /** TIMESTAMP type, represented by {@link LocalDateTime}. */
    SqlColumnType[SqlColumnType["TIMESTAMP"] = 11] = "TIMESTAMP";
    /** TIMESTAMP_WITH_TIME_ZONE type, represented by {@link OffsetDateTime}. */
    SqlColumnType[SqlColumnType["TIMESTAMP_WITH_TIME_ZONE"] = 12] = "TIMESTAMP_WITH_TIME_ZONE";
    /** OBJECT type, could be represented by any class. */
    SqlColumnType[SqlColumnType["OBJECT"] = 13] = "OBJECT";
    /**
     * The type of the generic SQL `NULL` literal.
     * The only valid value of `NULL` type is `null`.
     */
    SqlColumnType[SqlColumnType["NULL"] = 14] = "NULL";
    /** JSON type, represented by {@link HazelcastJsonValue} and JS objects */
    SqlColumnType[SqlColumnType["JSON"] = 15] = "JSON";
})(SqlColumnType = exports.SqlColumnType || (exports.SqlColumnType = {}));
/** @internal */
class SqlColumnMetadataImpl {
    constructor(name, type, isNullableExists, nullable) {
        if (isNullableExists) {
            this.nullable = nullable;
        }
        else {
            this.nullable = true;
        }
        this.name = name;
        this.type = type;
    }
}
exports.SqlColumnMetadataImpl = SqlColumnMetadataImpl;
//# sourceMappingURL=SqlColumnMetadata.js.map