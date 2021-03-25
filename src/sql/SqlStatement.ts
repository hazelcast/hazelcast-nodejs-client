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
