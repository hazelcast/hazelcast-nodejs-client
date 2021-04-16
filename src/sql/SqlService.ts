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
import {SqlResult, SqlResultImpl} from './SqlResult';
import {ConnectionManager, ConnectionRegistry} from '../network/ConnectionManager';
import {SqlExpectedResultType, SqlStatement, SqlStatementOptions} from './SqlStatement';
import {HazelcastSqlException, IllegalArgumentError} from '../core';
import {SqlErrorCode} from './SqlErrorCode';
import {SqlQueryId} from './SqlQueryId';
import {SerializationService} from '../serialization/SerializationService';
import {SqlExecuteCodec} from '../codec/SqlExecuteCodec';
import * as Long from 'long';
import {InvocationService} from '../invocation/InvocationService';
import {ClientMessage} from '../protocol/ClientMessage';
import {Connection} from '../network/Connection';
import {SqlRowMetadataImpl} from './SqlRowMetadata';
import {SqlCloseCodec} from '../codec/SqlCloseCodec';
import {SqlFetchCodec, SqlFetchResponseParams} from '../codec/SqlFetchCodec';
import {assertNotNull, deferredPromise, tryGetArray, tryGetEnum, tryGetLong, tryGetNumber, tryGetString} from '../util/Util';
import {SqlPage} from './SqlPage';


export interface SqlService {
    execute(sql: SqlStatement): SqlResult;

    execute(sql: string, params?: any[], options?: SqlStatementOptions): SqlResult;

    /**
     * Executes sql and returns SqlResult
     * @param {string | SqlStatement} sql sql statement, either string or SqlStatement
     * @param {array} params any list
     * @param {SqlStatementOptions} options options that are affecting how sql is executed
     * @throws {IllegalArgumentError} If arguments are not valid
     * @throws {HazelcastSqlException} If there is an error running sql
     * @returns {SqlResult} Sql result
     */
    execute(sql: string | SqlStatement, params?: any[], options?: SqlStatementOptions): SqlResult;
}

/** @internal */
export class SqlServiceImpl implements SqlService {
    /** Value for the timeout that is not set. */
    static readonly TIMEOUT_NOT_SET = Long.fromInt(-1);
    /** Value for the timeout that is disabled. */
    static readonly TIMEOUT_DISABLED = 0;
    /** Default timeout. */
    static readonly DEFAULT_TIMEOUT = SqlServiceImpl.TIMEOUT_NOT_SET;
    /** Default cursor buffer size. */
    static readonly DEFAULT_CURSOR_BUFFER_SIZE = 4096;

    static readonly RETURN_OBJECT_AS_RESULT = true; // return object result by default

    constructor(
        private readonly connectionRegistry: ConnectionRegistry,
        private readonly serializationService: SerializationService,
        private readonly invocationService: InvocationService,
        private readonly connectionManager: ConnectionManager
    ) {
    }

    /**
     *
     * @param clientMessage
     * @param res
     * @param connection
     */
    handleExecuteResponse(clientMessage: ClientMessage, res: SqlResultImpl, connection: Connection): void {
        const response = SqlExecuteCodec.decodeResponse(clientMessage);
        if (response.error !== null) {
            const responseError = new HazelcastSqlException(
                response.error.originatingMemberId,
                response.error.code,
                response.error.message,
                null
            )
            res.onExecuteError(responseError);
            return;
        }
        res.onExecuteResponse(
            response.rowMetadata !== null ? new SqlRowMetadataImpl(response.rowMetadata) : null,
            response.rowPage,
            response.updateCount
        )
    }

    /**
     * Validates sqlStatement
     *
     * @param sqlStatement
     * @throws RangeError if validation is not successful
     * @internal
     */
    static validateSqlStatement(sqlStatement: SqlStatement) : void {
        if(sqlStatement === undefined || sqlStatement === null){
            throw new RangeError('Sql statement cannot be undefined or null');
        }
        tryGetString(sqlStatement.sql);
        if(sqlStatement.params)tryGetArray(sqlStatement.params);
        if(sqlStatement.options)SqlServiceImpl.validateSqlStatementOptions(sqlStatement.options);
    }

    /**
     * Validates sqlStatementOptions
     *
     * @param sqlStatementOptions
     * @throws RangeError if validation is not successful
     * @internal
     */

    static validateSqlStatementOptions(sqlStatementOptions: SqlStatementOptions): void {
        if(sqlStatementOptions.schema)tryGetString(sqlStatementOptions.schema);
        if(sqlStatementOptions.timeoutMillis)tryGetLong(sqlStatementOptions.timeoutMillis);
        if(sqlStatementOptions.cursorBufferSize)tryGetNumber(sqlStatementOptions.cursorBufferSize);
        if(sqlStatementOptions.expectedResultType)tryGetEnum(SqlExpectedResultType, sqlStatementOptions.expectedResultType);
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
                sqlStatement.params = params;
            }
            if (options !== undefined && options !== null && typeof options === 'object') {
                sqlStatement.options = options;
            }
        } else if (typeof sql === 'object') { // assume SqlStatement is passed
            sqlStatement = sql;
        } else {
            throw new IllegalArgumentError('Sql can be an object or string');
        }

        try{
            SqlServiceImpl.validateSqlStatement(sqlStatement);

        } catch (error){
            throw new IllegalArgumentError(`Invalid argument given to execute(): ${error.message}`, error)
        }


        const connection = this.connectionRegistry.getRandomConnection(true);
        if (connection === null) {
            throw new HazelcastSqlException(
                this.connectionManager.getClientUuid(),
                SqlErrorCode.CONNECTION_PROBLEM,
                'Client is not currently connected to the cluster.'
            );
        }

        const queryId = SqlQueryId.fromMemberId(connection.getRemoteUuid());

        const expectedResultType: SqlExpectedResultType =
            sqlStatement.options?.expectedResultType ?  SqlExpectedResultType[sqlStatement.options.expectedResultType]
            : SqlExpectedResultType.ANY;

        try {
            const serializedParams = [];
            for (const param of params) {
                serializedParams.push(this.serializationService.toData(param));
            }
            const cursorBufferSize = sqlStatement.options?.cursorBufferSize ?
                sqlStatement.options.cursorBufferSize : SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE;
            const requestMessage = SqlExecuteCodec.encodeRequest(
                sqlStatement.sql,
                serializedParams,
                sqlStatement.options?.timeoutMillis ? sqlStatement.options.timeoutMillis : SqlServiceImpl.DEFAULT_TIMEOUT,
                cursorBufferSize,
                sqlStatement.options?.schema ? sqlStatement.options.schema : null,
                expectedResultType,
                queryId
            );

            const res = SqlResultImpl.newResult(
                this,
                connection,
                queryId,
                cursorBufferSize,
                SqlServiceImpl.RETURN_OBJECT_AS_RESULT
            );

            this.invocationService.invokeOnConnection(connection, requestMessage).then(clientMessage => {
                this.handleExecuteResponse(clientMessage, res, connection);
            }).catch(res.onExecuteError);

            return res;
        } catch (error) {
            throw new HazelcastSqlException(
                connection.getRemoteUuid(),
                SqlErrorCode.GENERIC,
                'An error occurred during sql execution',
                error
            );
        }
    }

    close(connection: Connection, queryId: SqlQueryId): Promise<void> {
        const requestMessage = SqlCloseCodec.encodeRequest(queryId);
        return this.invocationService.invokeOnConnection(connection, requestMessage).then(() => {
        });
    }

    fetch(connection: Connection, queryId: SqlQueryId, cursorBufferSize: number): Promise<SqlPage> {
        const requestMessage = SqlFetchCodec.encodeRequest(queryId, cursorBufferSize);
        const deferred = deferredPromise<SqlPage>();
        this.invocationService.invokeOnConnection(connection, requestMessage).then(clientMessage => {
            const response: SqlFetchResponseParams = SqlFetchCodec.decodeResponse(clientMessage);
            if (response.error !== null) {
                return deferred.reject(new HazelcastSqlException(
                    response.error.originatingMemberId,
                    response.error.code,
                    response.error.message
                ));
            }
            assertNotNull(response.rowPage);
            deferred.resolve(response.rowPage);

        }).catch(deferred.reject);
        return deferred.promise;
    }
}
