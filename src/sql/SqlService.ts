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
import {
    assertNotNull,
    tryGetArray,
    tryGetBoolean,
    tryGetEnum,
    tryGetLong,
    tryGetNumber,
    tryGetString
} from '../util/Util';
import {SqlPage} from './SqlPage';
import {HzLocalTime, HzLocalDate, HzLocalDateTime, HzOffsetDateTime} from './DatetimeClasses';

/**
 * SQL Service of the client. You can use this service to execute SQL queries.
 */
export interface SqlService {
    /**
     * Executes SQL and returns an SqlResult.
     * @param sql SQL string. SQL string placeholder character is question mark(`?`)
     * @param params Parameter list. The parameter count must be equal to number of placeholders in the SQL string
     * @param options Options that are affecting how SQL is executed
     * @throws {@link IllegalArgumentError} If arguments are not valid
     * @throws {@link HazelcastSqlException} If there is an error running SQL
     */
    execute(sql: string, params?: any[], options?: SqlStatementOptions): SqlResult;

    /**
     * Executes SQL and returns an SqlResult.
     * @param sql SQL statement object
     * @throws {@link IllegalArgumentError} If arguments are not valid
     * @throws {@link HazelcastSqlException} If there is an error running SQL
     */
    execute(sql: SqlStatement): SqlResult;
}

/** @internal */
export class SqlServiceImpl implements SqlService {
    /** Value for the timeout that is not set. */
    static readonly TIMEOUT_NOT_SET = Long.fromInt(-1);
    /** Default timeout. */
    static readonly DEFAULT_TIMEOUT = SqlServiceImpl.TIMEOUT_NOT_SET;
    /** Default cursor buffer size. */
    static readonly DEFAULT_CURSOR_BUFFER_SIZE = 4096;

    static readonly DEFAULT_FOR_RETURN_RAW_RESULT = false; // don't return raw result by default

    static readonly DEFAULT_EXPECTED_RESULT_TYPE = SqlExpectedResultType.ANY;

    static readonly DEFAULT_SCHEMA: string | null = null;

    constructor(
        private readonly connectionRegistry: ConnectionRegistry,
        private readonly serializationService: SerializationService,
        private readonly invocationService: InvocationService,
        private readonly connectionManager: ConnectionManager
    ) {
    }

    /**
     * Handles SQL execute response.
     * @param clientMessage The response message
     * @param res SQL result for this response
     */
    handleExecuteResponse(clientMessage: ClientMessage, res: SqlResultImpl): void {
        const response = SqlExecuteCodec.decodeResponse(clientMessage);
        if (response.error !== null) {
            res.onExecuteError(
                new HazelcastSqlException(
                    response.error.originatingMemberId, response.error.code, response.error.message
                )
            );
        } else {
            res.onExecuteResponse(
                response.rowMetadata !== null ? new SqlRowMetadataImpl(response.rowMetadata) : null,
                response.rowPage,
                response.updateCount
            );
        }
    }

    /**
     * Validates SqlStatement
     *
     * @param sqlStatement
     * @throws RangeError if validation is not successful
     * @internal
     */
    static validateSqlStatement(sqlStatement: SqlStatement | null): void {
        if (sqlStatement === null) {
            throw new RangeError('Sql statement cannot be null');
        }
        tryGetString(sqlStatement.sql);
        if (sqlStatement.hasOwnProperty('params')) // if params is provided, validate it
            tryGetArray(sqlStatement.params);
        if (sqlStatement.hasOwnProperty('options')) // if options is provided, validate it
            SqlServiceImpl.validateSqlStatementOptions(sqlStatement.options);
    }

    /**
     * Validates SqlStatementOptions
     *
     * @param sqlStatementOptions
     * @throws RangeError if validation is not successful
     * @internal
     */

    static validateSqlStatementOptions(sqlStatementOptions: SqlStatementOptions): void {
        if (sqlStatementOptions.hasOwnProperty('schema'))
            tryGetString(sqlStatementOptions.schema);

        if (sqlStatementOptions.hasOwnProperty('timeoutMillis')) {
            const longValue = tryGetLong(sqlStatementOptions.timeoutMillis);
            if (longValue.lessThanOrEqual(Long.fromInt(-2))) {
                throw new RangeError('Timeout millis cannot be less than -1');
            }
        }

        if (sqlStatementOptions.hasOwnProperty('cursorBufferSize') && tryGetNumber(sqlStatementOptions.cursorBufferSize) <= 0) {
            throw new RangeError('Cursor buffer size cannot be negative');
        }

        if (sqlStatementOptions.hasOwnProperty('expectedResultType'))
            tryGetEnum(SqlExpectedResultType, sqlStatementOptions.expectedResultType);

        if (sqlStatementOptions.hasOwnProperty('returnRawResult'))
            tryGetBoolean(sqlStatementOptions.returnRawResult);
    }

    /**
     * Converts datetime related wrapper classes to string to be able to serialize them. (No default serializers yet)
     * @internal
     * @param value
     */
    convertToStringIfDatetimeValue(value: any) {
        if (value instanceof HzLocalTime || value instanceof HzLocalDate || value instanceof HzLocalDateTime) {
            return value.toString();
        } else if (value instanceof HzOffsetDateTime) {
            return value.toISOString();
        } else {
            return value;
        }
    }

    execute(sql: SqlStatement): SqlResult;
    execute(sql: string, params?: any[], options?: SqlStatementOptions): SqlResult;
    execute(sql: string | SqlStatement, params?: any[], options?: SqlStatementOptions): SqlResult {
        let sqlStatement: SqlStatement;

        if (typeof sql === 'string') {
            sqlStatement = {
                sql: sql
            };
            if (params !== undefined) { // todo: document this
                sqlStatement.params = params;
            }
            if (options !== undefined) {
                sqlStatement.options = options;
            }
        } else if (typeof sql === 'object') { // assume SqlStatement is passed
            sqlStatement = sql;
        } else {
            throw new IllegalArgumentError('Sql can be an object or string');
        }

        try {
            SqlServiceImpl.validateSqlStatement(sqlStatement);
        } catch (error) {
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
            sqlStatement.options?.expectedResultType ? SqlExpectedResultType[sqlStatement.options.expectedResultType]
                : SqlServiceImpl.DEFAULT_EXPECTED_RESULT_TYPE;

        try {
            const serializedParams = [];
            if (Array.isArray(sqlStatement.params)) { // params can be undefined
                for (let param of sqlStatement.params) {
                    param = this.convertToStringIfDatetimeValue(param);
                    serializedParams.push(this.serializationService.toData(param));
                }
            }
            const cursorBufferSize = sqlStatement.options?.cursorBufferSize ?
                sqlStatement.options.cursorBufferSize : SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE;
            const requestMessage = SqlExecuteCodec.encodeRequest(
                sqlStatement.sql,
                serializedParams,
                sqlStatement.options?.timeoutMillis ? sqlStatement.options.timeoutMillis : SqlServiceImpl.DEFAULT_TIMEOUT,
                cursorBufferSize,
                sqlStatement.options?.schema ? sqlStatement.options.schema : SqlServiceImpl.DEFAULT_SCHEMA,
                expectedResultType,
                queryId
            );

            const res = SqlResultImpl.newResult(
                this,
                this.serializationService,
                connection,
                queryId,
                cursorBufferSize,
                sqlStatement.options?.hasOwnProperty('returnRawResult') ?
                    sqlStatement.options.returnRawResult : SqlServiceImpl.DEFAULT_FOR_RETURN_RAW_RESULT,
                this.connectionManager.getClientUuid()
            );

            this.invocationService.invokeOnConnection(connection, requestMessage).then(clientMessage => {
                this.handleExecuteResponse(clientMessage, res);
            }).catch(err => {
                console.log(err);
                res.onExecuteError(
                    new HazelcastSqlException(
                        connection.getRemoteUuid(), SqlErrorCode.CONNECTION_PROBLEM, err.message, err
                    )
                );
            });

            return res;
        } catch (error) {
            throw new HazelcastSqlException(
                connection.getRemoteUuid(),
                SqlErrorCode.GENERIC,
                `An error occurred during SQL execution: ${error.message}`,
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
        return this.invocationService.invokeOnConnection(connection, requestMessage).then(clientMessage => {
            const response: SqlFetchResponseParams = SqlFetchCodec.decodeResponse(clientMessage);
            if (response.error !== null) {
                throw new HazelcastSqlException(
                    response.error.originatingMemberId,
                    response.error.code,
                    response.error.message
                );
            }
            assertNotNull(response.rowPage);
            return response.rowPage;
        });
    }
}
