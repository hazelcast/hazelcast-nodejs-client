"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlServiceImpl = void 0;
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
const SqlResult_1 = require("./SqlResult");
const SqlStatement_1 = require("./SqlStatement");
const core_1 = require("../core");
const SqlErrorCode_1 = require("./SqlErrorCode");
const SqlQueryId_1 = require("./SqlQueryId");
const SqlExecuteCodec_1 = require("../codec/SqlExecuteCodec");
const Long = require("long");
const SqlRowMetadata_1 = require("./SqlRowMetadata");
const SqlCloseCodec_1 = require("../codec/SqlCloseCodec");
const SqlFetchCodec_1 = require("../codec/SqlFetchCodec");
const Util_1 = require("../util/Util");
const SqlError_1 = require("./SqlError");
/** @internal */
class SqlServiceImpl {
    constructor(serializationService, invocationService, connectionManager) {
        this.serializationService = serializationService;
        this.invocationService = invocationService;
        this.connectionManager = connectionManager;
    }
    /**
     * Handles SQL execute response.
     * @param response The response
     * @param res SQL result for this response
     */
    static handleExecuteResponse(response, res) {
        const sqlError = response.error;
        if (sqlError !== null) {
            throw new core_1.HazelcastSqlException(sqlError.originatingMemberId, sqlError.code, sqlError.message, sqlError.suggestion);
        }
        else {
            res.onExecuteResponse(response.rowMetadata !== null ? new SqlRowMetadata_1.SqlRowMetadataImpl(response.rowMetadata) : null, response.rowPage, response.updateCount);
        }
    }
    /**
     * Validates SqlStatement
     *
     * @param sqlStatement
     * @throws RangeError if validation is not successful
     */
    static validateSqlStatement(sqlStatement) {
        if (sqlStatement === null) {
            throw new RangeError('SQL statement cannot be null');
        }
        (0, Util_1.tryGetString)(sqlStatement.sql);
        if (sqlStatement.sql.length === 0) { // empty sql string is disallowed
            throw new RangeError('Empty SQL string is disallowed.');
        }
        if (sqlStatement.hasOwnProperty('params')) { // if params is provided, validate it
            (0, Util_1.tryGetArray)(sqlStatement.params);
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
    static validateSqlStatementOptions(sqlStatementOptions) {
        if (sqlStatementOptions.hasOwnProperty('schema')) {
            (0, Util_1.tryGetString)(sqlStatementOptions.schema);
        }
        if (sqlStatementOptions.hasOwnProperty('timeoutMillis')) {
            const timeoutMillis = (0, Util_1.tryGetNumber)(sqlStatementOptions.timeoutMillis);
            if (timeoutMillis < 0 && timeoutMillis !== -1) {
                throw new RangeError('Timeout millis can be non-negative or -1');
            }
        }
        if (sqlStatementOptions.hasOwnProperty('cursorBufferSize') && (0, Util_1.tryGetNumber)(sqlStatementOptions.cursorBufferSize) <= 0) {
            throw new RangeError('Cursor buffer size cannot be negative');
        }
        if (sqlStatementOptions.hasOwnProperty('expectedResultType')) {
            (0, Util_1.tryGetEnum)(SqlStatement_1.SqlExpectedResultType, sqlStatementOptions.expectedResultType);
        }
        if (sqlStatementOptions.hasOwnProperty('returnRawResult')) {
            (0, Util_1.tryGetBoolean)(sqlStatementOptions.returnRawResult);
        }
    }
    /**
     * Converts an error to HazelcastSqlException and returns it. Used by execute, close and fetch
     * @param err
     * @param connection
     * @returns {@link HazelcastSqlException}
     */
    rethrow(err, connection) {
        if (err instanceof core_1.HazelcastSqlException) {
            return err;
        }
        if (!connection.isAlive()) {
            return new core_1.HazelcastSqlException(this.connectionManager.getClientUuid(), SqlErrorCode_1.SqlErrorCode.CONNECTION_PROBLEM, 'Cluster topology changed while a query was executed:' +
                `Member cannot be reached: ${connection.getRemoteAddress()}`, undefined, err);
        }
        else {
            return this.toHazelcastSqlException(err);
        }
    }
    toHazelcastSqlException(err, message = err.message) {
        let originatingMemberId;
        if (err instanceof SqlError_1.SqlError) {
            originatingMemberId = err.originatingMemberId;
        }
        else {
            originatingMemberId = this.connectionManager.getClientUuid();
        }
        return new core_1.HazelcastSqlException(originatingMemberId, SqlErrorCode_1.SqlErrorCode.GENERIC, message, undefined, err);
    }
    executeStatement(sqlStatement) {
        var _a, _b, _c, _d, _e;
        try {
            SqlServiceImpl.validateSqlStatement(sqlStatement);
        }
        catch (error) {
            throw new core_1.IllegalArgumentError(`Invalid argument given to execute(): ${error.message}`, error);
        }
        let connection;
        try {
            connection = this.connectionManager.getConnectionRegistry().getConnectionForSql();
        }
        catch (e) {
            throw this.toHazelcastSqlException(e);
        }
        if (connection === null) {
            // The client is not connected to the cluster.
            throw new core_1.HazelcastSqlException(this.connectionManager.getClientUuid(), SqlErrorCode_1.SqlErrorCode.CONNECTION_PROBLEM, 'Client is not currently connected to the cluster.');
        }
        const queryId = SqlQueryId_1.SqlQueryId.fromMemberId(connection.getRemoteUuid());
        const expectedResultType = ((_a = sqlStatement.options) === null || _a === void 0 ? void 0 : _a.hasOwnProperty('expectedResultType')) ?
            SqlStatement_1.SqlExpectedResultType[sqlStatement.options.expectedResultType] : SqlServiceImpl.DEFAULT_EXPECTED_RESULT_TYPE;
        const timeoutMillis = ((_b = sqlStatement.options) === null || _b === void 0 ? void 0 : _b.hasOwnProperty('timeoutMillis')) ?
            Long.fromNumber(sqlStatement.options.timeoutMillis) : SqlServiceImpl.DEFAULT_TIMEOUT;
        const cursorBufferSize = ((_c = sqlStatement.options) === null || _c === void 0 ? void 0 : _c.hasOwnProperty('cursorBufferSize')) ?
            sqlStatement.options.cursorBufferSize : SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE;
        const returnRawResult = ((_d = sqlStatement.options) === null || _d === void 0 ? void 0 : _d.hasOwnProperty('returnRawResult')) ?
            sqlStatement.options.returnRawResult : SqlServiceImpl.DEFAULT_FOR_RETURN_RAW_RESULT;
        const schema = ((_e = sqlStatement.options) === null || _e === void 0 ? void 0 : _e.hasOwnProperty('schema')) ?
            sqlStatement.options.schema : SqlServiceImpl.DEFAULT_SCHEMA;
        try {
            let serializedParams;
            if (Array.isArray(sqlStatement.params)) { // params can be undefined
                serializedParams = new Array(sqlStatement.params.length);
                for (let i = 0; i < sqlStatement.params.length; i++) {
                    try {
                        serializedParams[i] = this.serializationService.toData(sqlStatement.params[i]);
                    }
                    catch (e) {
                        if (e instanceof core_1.SchemaNotReplicatedError) {
                            return this.invocationService.registerSchema(e.schema, e.clazz)
                                .then(() => this.executeStatement(sqlStatement));
                        }
                        throw e;
                    }
                }
            }
            else {
                serializedParams = [];
            }
            const requestMessage = SqlExecuteCodec_1.SqlExecuteCodec.encodeRequest(sqlStatement.sql, serializedParams, timeoutMillis, cursorBufferSize, schema, expectedResultType, queryId, false // Used to skip updating statistics from MC client, should be false in other clients
            );
            const result = SqlResult_1.SqlResultImpl.newResult(this, this.deserializeRowValue.bind(this), connection, queryId, cursorBufferSize, returnRawResult, this.connectionManager.getClientUuid());
            return this.invocationService.invokeOnConnection(connection, requestMessage, SqlExecuteCodec_1.SqlExecuteCodec.decodeResponse).then(response => {
                SqlServiceImpl.handleExecuteResponse(response, result);
                return result;
            }).catch(err => {
                const error = this.rethrow(err, connection);
                result.onExecuteError(error);
                throw error;
            });
        }
        catch (error) {
            throw this.rethrow(error, connection);
        }
    }
    execute(sql, params, options) {
        const sqlStatement = {
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
    close(connection, queryId) {
        const requestMessage = SqlCloseCodec_1.SqlCloseCodec.encodeRequest(queryId);
        return this.invocationService.invokeOnConnection(connection, requestMessage, x => x);
    }
    /**
     * Sends a fetch request on a connection for an SQL result using its query id.
     * @param connection The connection the request will be sent to
     * @param queryId The query id that defines the SQL result
     * @param cursorBufferSize The cursor buffer size associated with SQL fetch request, i.e its page size
     */
    fetch(connection, queryId, cursorBufferSize) {
        const requestMessage = SqlFetchCodec_1.SqlFetchCodec.encodeRequest(queryId, cursorBufferSize);
        return this.invocationService.invokeOnConnection(connection, requestMessage, clientMessage => {
            const response = SqlFetchCodec_1.SqlFetchCodec.decodeResponse(clientMessage);
            if (response.error !== null) {
                throw new core_1.HazelcastSqlException(response.error.originatingMemberId, response.error.code, response.error.message);
            }
            return response.rowPage;
        });
    }
    /**
     * Used for lazy deserialization of row values.
     * @param data The data to be deserialized.
     * @param isRaw `true` if the row is raw, i.e an {@link SqlRowImpl}; `false` otherwise, i.e a regular JSON object. Used to log
     * more information about lazy deserialization if row is a regular JSON object.
     */
    deserializeRowValue(data, isRaw) {
        try {
            return this.serializationService.toObject(data);
        }
        catch (e) {
            let message;
            if (e instanceof core_1.SchemaNotFoundError) {
                message = 'You tried to deserialize an SQL row which includes a compact serializable object, however '
                    + 'the schema for that object is not known by the client. The client won\'t fetch the schema of '
                    + 'the field because of lazy deserialization support. SQL\'s lazy deserialization support may '
                    + 'be removed in the future, after that you will no longer get this error.';
            }
            else {
                message = 'Failed to deserialize query result value.';
                if (!isRaw) {
                    message += 'In order to partially deserialize SQL rows you can set `returnRawResult` option to `true`. Check '
                        + 'out the "Lazy SQL Row Deserialization" section in the client\'s reference manual.';
                }
                message += ` Error: ${e.message}`;
            }
            throw this.toHazelcastSqlException(e, message);
        }
    }
}
exports.SqlServiceImpl = SqlServiceImpl;
/** Value for the timeout that is not set. */
SqlServiceImpl.TIMEOUT_NOT_SET = Long.fromInt(-1);
/** Default timeout. */
SqlServiceImpl.DEFAULT_TIMEOUT = SqlServiceImpl.TIMEOUT_NOT_SET;
/** Default cursor buffer size. */
SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE = 4096;
SqlServiceImpl.DEFAULT_FOR_RETURN_RAW_RESULT = false; // don't return raw result by default
SqlServiceImpl.DEFAULT_EXPECTED_RESULT_TYPE = SqlStatement_1.SqlExpectedResultType.ANY;
SqlServiceImpl.DEFAULT_SCHEMA = null;
//# sourceMappingURL=SqlService.js.map