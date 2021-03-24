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

import Long = require('long');

declare type Varchar = string;
declare type TinyInt = number;
declare type SmallInt = number;
declare type Integer = number;
declare type BigInt = Long;
declare type Decimal = number;
declare type Real = number;
declare type Double = number;
declare type Time = Date;
declare type Timestamp = Date;
declare type TimestampWithTimezone = Date;

declare type SqlColumnType = Varchar | boolean | TinyInt | SmallInt | Integer |
    BigInt | Decimal | Real | Double | Date | Time | Timestamp | TimestampWithTimezone |
    any | null;

export interface SqlRow {
    getObject(columnIndex: number): SqlColumnType;
}


export interface SqlResult extends Iterable<SqlRow> {

}

export interface SqlStatement {
    sql: string;
    parameters: any[];
    timeout: number;
    cursorBufferSize: number;
    schema: string;
    expectedResultType: SqlExpectedResultType;
}

declare enum SqlExpectedResultType {
    /** The statement may produce either rows or an update count. */
    ANY,

    /** The statement must produce rows. An exception is thrown is the statement produces an update count. */
    ROWS,

    /** The statement must produce an update count. An exception is thrown is the statement produces rows. */
    UPDATE_COUNT
}

let a: SqlResult;

for (const b of a) {
    let c: string = b.getObject(1);
    c += 1;
    console.log(c);
}

export interface SqlService {

    execute(sql: string): SqlResult;

    /**
     * Convenient method to execute a distributed query with the given parameters.
     * Converts passed SQL string and parameters into an {@link SqlStatement} object and invokes {@link #execute(SqlStatement)}.
     *
     * @param sql SQL string
     * @param params query parameters that will be passed to {@link SqlStatement#setParameters(List)}
     * @returns {@link SqlResult}
     */
    execute(sql: string, ...params: any[]): SqlResult;
}

