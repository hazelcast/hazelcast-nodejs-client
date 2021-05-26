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

import * as Long from 'long';

/**
 * The expected statement result type.
 */
export enum SqlExpectedResultType {
    /** The statement may produce either rows or an update count. */
    ANY,
    /** The statement must produce rows. An exception is thrown if the statement produces an update count. */
    ROWS,
    /** The statement must produce an update count. An exception is thrown if the statement produces rows. */
    UPDATE_COUNT
}

export type SqlExpectedResultTypeStrings = keyof typeof SqlExpectedResultType;

/**
 * Options used to change behavior of an SQL query.
 */
export interface SqlStatementOptions {
    /**
     * The schema name. The engine will try to resolve the non-qualified object identifiers from the statement in the
     * given schema. If not found, the default search path will be used, which looks for objects in the predefined
     * schemas `partitioned` and `public`.
     *
     * * The schema name is case sensitive. For example, `foo` and `Foo` are different schemas.
     * * The default value is `null` meaning only the default search path is used.
     */
    schema?: string | null;
    /**
     * The execution timeout in milliseconds. If the timeout is reached for a running statement, it will be cancelled forcefully.
     * Zero value means no timeout. `-1` means that the timeout in server config will be used.
     * Other negative values are prohibited.
     * Defaults to `-1`.
     */
    timeoutMillis?: Long | number;
    /**
     * The cursor buffer size (measured in the number of rows).
     *
     * When a statement is submitted for execution, a {@link SqlResult} is returned as a result. When rows are ready to be
     * consumed, they are put into an internal buffer of the cursor. This parameter defines the maximum number of rows in
     * that buffer. When the threshold is reached, the backpressure mechanism will slow down the execution, possibly to a
     * complete halt, to prevent out-of-memory.
     *
     * Only positive values are allowed.
     *
     * The default value is expected to work well for most workloads. A bigger buffer size may give you a slight performance
     * boost for queries with large result sets at the cost of increased memory consumption.
     *
     * Defaults to `4096`.
     */
    cursorBufferSize?: number;
    /**
     * Expected result type of SQL query. By default, set to `ANY`. Available values
     * are `ANY`, `ROWS`, and `UPDATE_COUNT`.
     */
    expectedResultType?: SqlExpectedResultTypeStrings;
    /**
     * If true, SQL result will iterate over {@link SqlRow}s. If false SQL result, will iterate over regular objects.
     * Defaults to `false`.
     */
    returnRawResult?: boolean;
}

/**
 * Represents an SQL statement. This can be used to prepare SQL statement before {@link SqlService.execute}.
 */
export interface SqlStatement {
    /**
     * SQL string. SQL string placeholder character is question mark(`?`).
     */
    sql: string;
    /**
     * Parameters of the SQL. Parameter count must be equal to the placeholder count in the SQL string.
     */
    params?: any[];
    /**
     * Options of the SQL statement.
     */
    options?: SqlStatementOptions;
}
