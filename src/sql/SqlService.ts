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
import {SqlResult} from './SqlResult';
import {ConnectionRegistry} from '../network/ConnectionManager';
import {SqlStatement, SqlStatementOptions} from './SqlStatement';
import {IllegalArgumentError} from '../core';


export interface SqlService {
    execute(sql: SqlStatement): SqlResult;
    execute(sql: string, params?: any[], options?: SqlStatementOptions): SqlResult;
    execute(sql: string | SqlStatement, params?: any[], options?: SqlStatementOptions): SqlResult;
}

/** @internal */
export class SqlServiceImpl implements SqlService {
    constructor(
        private readonly connectionRegistry: ConnectionRegistry
    ) {
    }

    execute(sql: SqlStatement): SqlResult;
    execute(sql: string, params?: any[], options?: SqlStatementOptions): SqlResult;
    execute(sql: string | SqlStatement, params?: any[], options?: SqlStatementOptions): SqlResult {
        let sqlStatement: SqlStatement;
        if (typeof sql === 'string') {
            sqlStatement = {
                sql: sql
            };
            if (Array.isArray(params)) {
                sqlStatement.parameters = params;
            }
            if (options !== undefined && options !== null) {
                sqlStatement.options = options;
            }
        } else if (typeof sql === 'object') {
            sqlStatement = sql;
        } else {
            throw new IllegalArgumentError('Sql parameter must be a string or an SqlStatement object');
        }

        return undefined;
    }
}
