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

import {IllegalArgumentError} from '../core';

export enum SqlExpectedResultType {
    ANY,
    ROWS,
    UPDATE_COUNT
}

export interface SqlStatement {
    new SqlStatement(): SqlStatement;
    /**
     * Gets the SQL string to be executed.
     *
     * @returns SQL string
     */
    getSql(): string;

    /**
     * Sets the SQL string to be executed.
     *
     * The SQL string cannot be null or empty.
     *
     * @param sql SQL string
     * @returns this instance for chaining
     */
    setSql(sql: string): SqlStatement;

    /**
     * Gets the schema name.
     *
     * @return the schema name or undefined if there is none
     */
    getSchema(): string;

    /**
     * Sets the schema name. The engine will try to resolve the non-qualified
     * object identifiers from the statement in the given schema. If not found, the default
     * search path will be used, which looks for objects in the predefined schemas "partitioned"
     * and "public".
     *
     * The schema name is case sensitive. For example, "foo" and "Foo" are different schemas.
     *
     * The default value is undefined, meaning only the default search path is used.
     *
     * @param schema the current schema name
     * @returns this instance for chaining
     */
    setSchema(schema: string): SqlStatement;

    /**
     * Gets the statement parameters.
     *
     * @returns statement parameters
     */
    getParameters(): any[];

    /**
     * Sets the statement parameters. If an array is not passed to this method, the parameters will be set to empty array.
     *
     * You may define parameter placeholders in the statement with the "?" character. For every placeholder, a parameter
     * value must be provided.
     *
     * When the method is called, the content of the parameters list is copied. Subsequent changes to the original list don't
     * change the statement parameters.
     *
     * @param parameters statement parameters
     * @returns this instance for chaining
     *
     * see {@link addParameter}
     * see {@link clearParameters}
     */
    setParameters(parameters: any[]): SqlStatement;

    /**
     * Adds a single parameter to the end of the parameters list.
     *
     * @param parameter parameter
     * @returns this instance for chaining
     *
     * see {@link setParameters}
     * see {@link clearParameters}
     */
    addParameter(parameter: any): SqlStatement;

    /**
     * Clears statement parameters.
     *
     * @return this instance for chaining
     *
     * see {@link setParameters}
     * see {@link addParameter}
     */
    clearParameters(): SqlStatement;

    /**
     * Gets the execution timeout in milliseconds.
     *
     * @returns execution timeout in milliseconds
     */
    getTimeoutMillis(): number;

    /**
     * Sets the execution timeout in milliseconds.
     *
     * If the timeout is reached for a running statement, it will be cancelled forcefully.
     *
     * Zero value means no timeout. If you don't give a timeout argument the timeout value from
     * {@link SqlConfig#statementTimeoutMillis} will be used.
     *
     * Defaults to {@link SqlConfig#statementTimeoutMillis}.
     *
     * @param timeout execution timeout in milliseconds, 0 for no timeout, -1 to user member's default timeout
     * @return this instance for chaining
     *
     * see {@link SqlConfig#statementTimeoutMillis}
     */
    setTimeoutMillis(timeout: number): SqlStatement;

    /**
     * Gets the cursor buffer size (measured in the number of rows).
     *
     * @returns cursor buffer size (measured in the number of rows)
     */
    getCursorBufferSize(): number;

    /**
     * Sets the cursor buffer size (measured in the number of rows).
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
     * Defaults to {@value #SqlConfig#defaultCursorBufferSize}.
     *
     * @param cursorBufferSize cursor buffer size (measured in the number of rows)
     * @returns this instance for chaining
     *
     * see {@link SqlService#execute}
     * see {@link SqlResult}
     */
    setCursorBufferSize(cursorBufferSize: number): SqlStatement;

    /**
     * Gets the expected result type.
     *
     * @returns expected result type
     */
    getExpectedResultType(): SqlExpectedResultType;

    /**
     * Sets the expected result type.
     *
     * @param expectedResultType expected result type
     * @returns this instance for chaining
     */
    setExpectedResultType(expectedResultType: SqlExpectedResultType): SqlStatement;
}

/** @internal */
export class SqlStatementImpl implements SqlStatement {

    static readonly TIMEOUT_NOT_SET: number = -1;
    static readonly TIMEOUT_DISABLED: number = 0;
    static readonly DEFAULT_CURSOR_BUFFER_SIZE: number = 4096;
    static readonly DEFAULT_TIMEOUT: number = SqlStatementImpl.TIMEOUT_NOT_SET


    constructor(
        private sql: string,
        private parameters: any[],
        private timeout: number,
        private cursorBufferSize: number,
        private readonly expectedResultType: SqlExpectedResultType,
        private schema?: string
    ) {
    }

    getSql(): string {
        return this.sql;
    }

    setSql(sql: string): SqlStatement {
        if (sql === null || sql === undefined) {
            throw new IllegalArgumentError('SQL cannot be null or undefined')
        }

        if (sql.length == 0) {
            throw new IllegalArgumentError('SQL cannot be empty');
        }

        this.sql = sql;
        return this;
    }

    getSchema(): string {
        return this.schema;
    }

    setSchema(schema: string): SqlStatement {
        this.schema = schema;
        return this;
    }

    getParameters(): any[] {
        return this.parameters;
    }

    setParameters(parameters: any[]): SqlStatement {
        if (Array.isArray(parameters)) {
            // clone the array
            this.parameters = [...parameters];
        } else {
            this.parameters = [];
        }
        return this;
    }

    addParameter(parameter: any): SqlStatement {
        this.parameters.push(parameter);
        return this;
    }

    clearParameters(): SqlStatement {
        this.parameters = [];
        return this;
    }

    getTimeoutMillis(): number {
        return this.timeout;
    }

    setTimeoutMillis(timeout: number): SqlStatement {
        this.timeout = timeout;
        return this;
    }
}
