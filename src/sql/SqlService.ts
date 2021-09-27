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
import {SqlFetchCodec} from '../codec/SqlFetchCodec';
import {
    tryGetArray,
    tryGetBoolean,
    tryGetEnum,
    tryGetNumber,
    tryGetString
} from '../util/Util';
import {SqlPage} from './SqlPage';
import {Data} from '../serialization';
import {SqlError} from './SqlError';

/**
 * SQL Service of the client. You can use this service to execute SQL queries.
 *
 * The service is in beta state. Behavior and API might change in future releases.
 *
 * ### Overview
 * Hazelcast is able to execute distributed SQL queries over the following entities:
 * * IMap
 *
 * ##### Querying an IMap
 *
 * Every IMap instance is exposed as a table with the same name in the `partitioned` schema. The `partitioned`
 * schema is included into a default search path, therefore an IMap could be referenced in an SQL statement with or without the
 * schema name.
 *
 * ###### Column Resolution
 *
 * Every table backed by an IMap has a set of columns that are resolved automatically. Column resolution uses IMap entries
 * located on the member that initiates the query. The engine extracts columns from a key and a value and then merges them
 * into a single column set. In case the key and the value have columns with the same name, the key takes precedence.
 *
 * Columns are extracted from objects as follows(which happens on the server-side):
 * * For non-Portable objects, public getters and fields are used to populate the column list. For getters, the first
 *   letter is converted to lower case. A getter takes precedence over a field in case of naming conflict.
 * * For Portable objects, field names used in the {@link PortableWriter.writePortable} method are used to populate the column
 *   list
 *
 * The whole key and value objects could be accessed through a special fields `__key` and `this`, respectively. If
 * key (value) object has fields, then the whole key (value) field is exposed as a normal field. Otherwise the field is hidden.
 * Hidden fields can be accessed directly, but are not returned by `SELECT * FROM ...` queries.
 *
 * If the member that initiates a query doesn't have local entries for the given IMap, the query fails.
 *
 * Consider the following key/value model using Portable classes:
 *
 * ```js
 * class PersonKey {
 *     constructor(personId, deptId) {
 *         this.personId = personId;
 *         this.deptId = deptId;
 *     }
 *
 *     writePortable(writer) {
 *         writer.writeLong('personId', this.personId);
 *         writer.writeLong('deptId', this.deptId);
 *     }
 * }
 *
 * class Person {
 *     constructor(name) {
 *         this.name = name;
 *     }
 *
 *     writePortable(writer) {
 *         writer.writeString('name', this.name);
 *     }
 * }
 * ```
 * This model will be resolved to the following table columns:
 * * personId BIGINT
 * * deptId BIGINT
 * * name VARCHAR
 * * __key OBJECT (hidden)
 * * this OBJECT (hidden)
 *
 * ##### Consistency
 *
 * Results returned from IMap query are weakly consistent:
 * * If an entry was not updated during iteration, it is guaranteed to be returned exactly once.
 * * If an entry was modified during iteration, it might be returned zero, one or several times.
 *
 * #### Usage
 *
 * When a query is executed, an {@link SqlResult} is returned. The returned result is an async iterable. It can also be
 * iterated using {@link SqlResult.next} method. The result should be closed at the end to release server resources.
 * Fetching the last page closes the result.
 * The code snippet below demonstrates a typical usage pattern:
 *
 * ```
 * const client = await Client.newHazelcastClient();
 * const result = await client.getSqlService().execute('SELECT * FROM person');
 * for await (const row of result) {
 *    console.log(row.personId);
 *    console.log(row.name);
 * }
 * await result.close();
 * await client.shutdown();
 * ```
 */
export interface SqlService {
    /**
     * Executes SQL and returns an {@link SqlResult}.
     * Converts passed SQL string and parameter values into an {@link SqlStatement} object and invokes {@link executeStatement}.
     *
     * @param sql SQL string. SQL string placeholder character is question mark(`?`)
     * @param params Parameter list. The parameter count must be equal to number of placeholders in the SQL string
     * @param options Options that are affecting how the query is executed
     * @throws {@link IllegalArgumentError} if arguments are not valid
     * @throws {@link HazelcastSqlException} in case of an execution error
     */
    execute(sql: string, params?: any[], options?: SqlStatementOptions): Promise<SqlResult>;

    /**
     * Executes SQL and returns an {@link SqlResult}.
     * @param sql SQL statement object
     * @throws {@link IllegalArgumentError} if arguments are not valid
     * @throws {@link HazelcastSqlException} in case of an execution error
     */
    executeStatement(sql: SqlStatement): Promise<SqlResult>;
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

    static readonly DEFAULT_SCHEMA: null = null;

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
    private static handleExecuteResponse(clientMessage: ClientMessage, res: SqlResultImpl): void {
        const response = SqlExecuteCodec.decodeResponse(clientMessage);
        const sqlError = response.error;
        if (sqlError !== null) {
            throw new HazelcastSqlException(sqlError.originatingMemberId, sqlError.code, sqlError.message, sqlError.suggestion);
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
     */
    private static validateSqlStatement(sqlStatement: SqlStatement | null): void {
        if (sqlStatement === null) {
            throw new RangeError('SQL statement cannot be null');
        }
        tryGetString(sqlStatement.sql);
        if (sqlStatement.sql.length === 0) { // empty sql string is disallowed
            throw new RangeError('Empty SQL string is disallowed.')
        }
        if (sqlStatement.hasOwnProperty('params')) { // if params is provided, validate it
            tryGetArray(sqlStatement.params);
        }
        if (sqlStatement.hasOwnProperty('options')) { // if options is provided, validate it
            SqlServiceImpl.validateSqlStatementOptions(sqlStatement.options);
        }
    }

    /**
     * Validates SqlStatementOptions
     *
     * @param sqlStatementOptions
     * @throws RangeError if validation is not successful
     */
    private static validateSqlStatementOptions(sqlStatementOptions: SqlStatementOptions): void {
        if (sqlStatementOptions.hasOwnProperty('schema')) {
            tryGetString(sqlStatementOptions.schema);
        }

        if (sqlStatementOptions.hasOwnProperty('timeoutMillis')) {
            const timeoutMillis = tryGetNumber(sqlStatementOptions.timeoutMillis);

            if (timeoutMillis < 0 && timeoutMillis !== -1) {
                throw new RangeError('Timeout millis can be non-negative or -1');
            }
        }

        if (sqlStatementOptions.hasOwnProperty('cursorBufferSize') && tryGetNumber(sqlStatementOptions.cursorBufferSize) <= 0) {
            throw new RangeError('Cursor buffer size cannot be negative');
        }

        if (sqlStatementOptions.hasOwnProperty('expectedResultType')) {
            tryGetEnum(SqlExpectedResultType, sqlStatementOptions.expectedResultType);
        }

        if (sqlStatementOptions.hasOwnProperty('returnRawResult')) {
            tryGetBoolean(sqlStatementOptions.returnRawResult);
        }
    }

    /**
     * Converts an error to HazelcastSqlException and returns it. Used by execute, close and fetch
     * @param err
     * @param connection
     * @returns {@link HazelcastSqlException}
     */
    rethrow(err: Error, connection: Connection): HazelcastSqlException {
        if (err instanceof HazelcastSqlException) {
            return err;
        }

        if (!connection.isAlive()) {
            return new HazelcastSqlException(
                this.connectionManager.getClientUuid(),
                SqlErrorCode.CONNECTION_PROBLEM,
                'Cluster topology changed while a query was executed:' +
                `Member cannot be reached: ${connection.getRemoteAddress()}`,
                undefined,
                err
            )
        } else {
            return this.toHazelcastSqlException(err);
        }
    }

    toHazelcastSqlException(err: Error, message: string = err.message): HazelcastSqlException {
        let originatingMemberId;
        if (err instanceof SqlError) {
            originatingMemberId = err.originatingMemberId;
        } else {
            originatingMemberId = this.connectionManager.getClientUuid();
        }
        return new HazelcastSqlException(
            originatingMemberId, SqlErrorCode.GENERIC, message, undefined, err
        );
    }

    executeStatement(sqlStatement: SqlStatement): Promise<SqlResult> {
        try {
            SqlServiceImpl.validateSqlStatement(sqlStatement);
        } catch (error) {
            throw new IllegalArgumentError(`Invalid argument given to execute(): ${error.message}`, error)
        }

        let connection: Connection | null;

        try {
            connection = this.connectionRegistry.getConnectionForSql();
        } catch (e) {
            throw this.toHazelcastSqlException(e);
        }

        if (connection === null) {
            // The client is not connected to the cluster.
            throw new HazelcastSqlException(
                this.connectionManager.getClientUuid(),
                SqlErrorCode.CONNECTION_PROBLEM,
                'Client is not currently connected to the cluster.'
            );
        }

        const queryId = SqlQueryId.fromMemberId(connection.getRemoteUuid());

        const expectedResultType: SqlExpectedResultType = sqlStatement.options?.hasOwnProperty('expectedResultType') ?
            SqlExpectedResultType[sqlStatement.options.expectedResultType] : SqlServiceImpl.DEFAULT_EXPECTED_RESULT_TYPE;

        let timeoutMillis: Long;
        if (sqlStatement.options?.hasOwnProperty('timeoutMillis')) {
            timeoutMillis = Long.fromNumber(sqlStatement.options.timeoutMillis);
        } else {
            timeoutMillis = SqlServiceImpl.DEFAULT_TIMEOUT;
        }

        try {
            let serializedParams;
            if (Array.isArray(sqlStatement.params)) { // params can be undefined
                serializedParams = new Array(sqlStatement.params.length);
                for (let i = 0; i < sqlStatement.params.length; i++) {
                    serializedParams[i] = this.serializationService.toData(sqlStatement.params[i]);
                }
            } else {
                serializedParams = [];
            }
            const cursorBufferSize = sqlStatement.options?.hasOwnProperty('cursorBufferSize') ?
                sqlStatement.options.cursorBufferSize : SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE;

            const returnRawResult = sqlStatement.options?.hasOwnProperty('returnRawResult') ?
                sqlStatement.options.returnRawResult : SqlServiceImpl.DEFAULT_FOR_RETURN_RAW_RESULT;

            const schema = sqlStatement.options?.hasOwnProperty('schema') ?
                sqlStatement.options.schema : SqlServiceImpl.DEFAULT_SCHEMA;

            const requestMessage = SqlExecuteCodec.encodeRequest(
                sqlStatement.sql,
                serializedParams,
                timeoutMillis,
                cursorBufferSize,
                schema,
                expectedResultType,
                queryId,
                false // Used to skip updating statistics from MC client, should be false in other clients
            );

            const res = SqlResultImpl.newResult(
                this,
                this.deserializeRowValue.bind(this),
                connection,
                queryId,
                cursorBufferSize,
                returnRawResult,
                this.connectionManager.getClientUuid()
            );

            return this.invocationService.invokeOnConnection(connection, requestMessage).then(clientMessage => {
                SqlServiceImpl.handleExecuteResponse(clientMessage, res);
                return res;
            }).catch(err => {
                const error = this.rethrow(err, connection);
                res.onExecuteError(error);
                throw error;
            });
        } catch (error) {
            throw this.rethrow(error, connection);
        }
    }

    execute(sql: string, params?: any[], options?: SqlStatementOptions): Promise<SqlResult> {
        const sqlStatement: SqlStatement = {
            sql: sql
        };
        // If params is not provided it won't be validated. Default value for optional parameters is undefined.
        // So, if they are undefined we don't set it, and in validator method we check for property existence.
        if (params !== undefined) {
            sqlStatement.params = params;
        }
        if (options !== undefined) {
            sqlStatement.options = options;
        }
        return this.executeStatement(sqlStatement);
    }

    /**
     * Sends a close request on a connection for an SQL result using its query id.
     * @param connection The connection the request will be sent to
     * @param queryId The query id that defines the SQL result
     */
    close(connection: Connection, queryId: SqlQueryId): Promise<ClientMessage> {
        const requestMessage = SqlCloseCodec.encodeRequest(queryId);
        return this.invocationService.invokeOnConnection(connection, requestMessage);
    }

    /**
     * Sends a fetch request on a connection for an SQL result using its query id.
     * @param connection The connection the request will be sent to
     * @param queryId The query id that defines the SQL result
     * @param cursorBufferSize The cursor buffer size associated with SQL fetch request, i.e its page size
     */
    fetch(connection: Connection, queryId: SqlQueryId, cursorBufferSize: number): Promise<SqlPage> {
        const requestMessage = SqlFetchCodec.encodeRequest(queryId, cursorBufferSize);
        return this.invocationService.invokeOnConnection(connection, requestMessage).then(clientMessage => {
            const response = SqlFetchCodec.decodeResponse(clientMessage);
            if (response.error !== null) {
                throw new HazelcastSqlException(
                    response.error.originatingMemberId,
                    response.error.code,
                    response.error.message
                );
            }
            return response.rowPage;
        });
    }

    /**
     * Used for lazy deserialization of row values.
     */
    private deserializeRowValue(data: Data) : any {
        try {
            return this.serializationService.toObject(data);
        } catch (e) {
            throw this.toHazelcastSqlException(e, `Failed to deserialize query result value: ${e.message}`);
        }
    }
}
