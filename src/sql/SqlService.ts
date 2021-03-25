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
import {Connection} from '../network/Connection';
import {ConnectionRegistry} from '../network/ConnectionManager';
import {HazelcastSqlException} from '../core';
import {SqlErrorCode} from './SqlErrorCode';
import {QueryId} from './QueryId';
import {SqlStatement, SqlStatementImpl} from './SqlStatement';


export interface SqlService {
    /**
     * Convenient method to execute a distributed query with the given parameters.
     * Converts passed SQL string and parameters into an SqlStatement object and invokes #execute(SqlStatement).
     *
     * @param sql SQL string
     * @param params query parameters that will be passed to {@link SqlStatement#setParameters(List)}
     * @returns {@link SqlResult}
     */
    execute(sql: string, ...params: any[]): SqlResult;


    /**
     * Executes a sql string.
     * Converts passed SQL string into an SqlStatement object and invokes execute(SqlStatement).
     *
     * @param sql SQL string
     * @returns {@link SqlResult}
     */
    execute(sql: SqlStatement): SqlResult;
}

/** @internal */
export class SqlServiceImpl implements SqlService {
    constructor(
        private readonly connectionRegistry: ConnectionRegistry
    ) {}

    execute(sql: string, ...params: any[]): SqlResult{
        const sqlStatement = new SqlStatementImpl();
        this.execute();
    }

    execute(sql: SqlStatement, ...params: any[]): SqlResult {
        const connection: Connection = this.connectionRegistry.getRandomConnection(true);

        if (connection == null) {
            throw new HazelcastSqlException(
                SqlErrorCode.CONNECTION_PROBLEM,
                'Client is not currently connected to the cluster.'
            );
        }

        const id = QueryId.create(connection.getRemoteUuid());
        try {
            const params = statement.get
        } catch (err) {

        }

    }
}
