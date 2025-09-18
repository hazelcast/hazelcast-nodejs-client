"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvocationService = exports.Invocation = void 0;
const core_1 = require("../core");
const ClientMessage_1 = require("../protocol/ClientMessage");
const ClientLocalBackupListenerCodec_1 = require("../codec/ClientLocalBackupListenerCodec");
const ErrorsCodec_1 = require("../codec/builtin/ErrorsCodec");
const Util_1 = require("../util/Util");
const MAX_FAST_INVOCATION_COUNT = 5;
const PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS = 'hazelcast.client.invocation.retry.pause.millis';
const PROPERTY_INVOCATION_TIMEOUT_MILLIS = 'hazelcast.client.invocation.timeout.millis';
const PROPERTY_CLEAN_RESOURCES_MILLIS = 'hazelcast.client.internal.clean.resources.millis';
const PROPERTY_BACKUP_TIMEOUT_MILLIS = 'hazelcast.client.operation.backup.timeout.millis';
const PROPERTY_FAIL_ON_INDETERMINATE_STATE = 'hazelcast.client.operation.fail.on.indeterminate.state';
/**
 * A request to be sent to a hazelcast node.
 * @internal
 */
class Invocation {
    constructor(invocationService, request, timeoutMillis) {
        /**
         * Number of backups acks received.
         */
        this.backupsAcksReceived = 0;
        /**
         * Number of expected backups. It is set correctly as soon as the pending response is set.
         */
        this.backupsAcksExpected = -1;
        /**
         * The time in millis when the response of the primary has been received.
         */
        this.pendingResponseReceivedMillis = -1;
        this.invokeCount = 0;
        /**
         * Handler is responsible for handling the client message and returning an object. The default value
         * is the identity function which returns the clientMessage itself.
         */
        this.handler = x => x;
        /**
         * True if this invocation is urgent (can be invoked even in the client is in the disconnected state), false otherwise.
         */
        this.urgent = false;
        this.invocationService = invocationService;
        this.deadline = timeoutMillis === undefined
            ? Date.now() + this.invocationService.invocationTimeoutMillis
            : Date.now() + timeoutMillis;
        this.request = request;
    }
    /**
     * @returns {boolean}
     */
    hasPartitionId() {
        return this.hasOwnProperty('partitionId') && this.partitionId >= 0;
    }
    shouldRetry(err) {
        if (err instanceof core_1.InvocationMightContainCompactDataError) {
            return true;
        }
        if (this.connection != null
            && (err instanceof core_1.IOError || err instanceof core_1.TargetDisconnectedError)) {
            return false;
        }
        if (this.uuid != null && err instanceof core_1.TargetNotMemberError) {
            // when invocation is sent to a specific member
            // and target is no longer a member, we should not retry
            // note that this exception could come from the server
            return false;
        }
        if (err instanceof core_1.IOError
            || err instanceof core_1.HazelcastInstanceNotActiveError
            || err instanceof core_1.RetryableHazelcastError) {
            return true;
        }
        if (err instanceof core_1.TargetDisconnectedError) {
            return this.request.isRetryable() || this.invocationService.redoOperationEnabled();
        }
        return false;
    }
    notify(clientMessage) {
        const expectedBackups = clientMessage.getNumberOfBackupAcks();
        if (expectedBackups > this.backupsAcksReceived) {
            this.pendingResponseReceivedMillis = Date.now();
            this.backupsAcksExpected = expectedBackups;
            this.pendingResponseMessage = clientMessage;
            return;
        }
        this.complete(clientMessage);
    }
    notifyBackupComplete() {
        this.backupsAcksReceived++;
        if (this.pendingResponseMessage == null) {
            return;
        }
        if (this.backupsAcksExpected !== this.backupsAcksReceived) {
            return;
        }
        this.complete(this.pendingResponseMessage);
    }
    detectAndHandleBackupTimeout(timeoutMillis) {
        if (this.pendingResponseMessage == null) {
            return;
        }
        if (this.backupsAcksExpected === this.backupsAcksReceived) {
            return;
        }
        const expirationTime = this.pendingResponseReceivedMillis + timeoutMillis;
        const timeoutReached = expirationTime > 0 && expirationTime < Date.now();
        if (!timeoutReached) {
            return;
        }
        if (this.invocationService.shouldFailOnIndeterminateState) {
            this.completeWithError(new core_1.IndeterminateOperationStateError('Invocation '
                + this.request.getCorrelationId() + ' failed because of missed backup acks'));
            return;
        }
        this.complete(this.pendingResponseMessage);
    }
    complete(clientMessage) {
        /**
         * The following is a part of eager deserialization that is needed for compact serialization. In
         * eager deserialization invocations have handlers that are called in {@link complete}.
         * This invocation handler usually includes toObject calls and as seen below it is put
         * into a try/catch block because {@link CompactStreamSerializer} might throw {@link SchemaNotFoundError}.
         * If it throws, we fetch the required schema and try to call handler again. If the handler is successful,
         * we complete the invocation. If another exception is thrown we complete the invocation with an error.
         */
        try {
            const result = this.handler(clientMessage);
            this.deferred.resolve(result);
            this.invocationService.deregisterInvocation(this.request.getCorrelationId());
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotFoundError) {
                // We need to fetch the schema to deserialize compact.
                this.invocationService.logger.trace('SchemaService', `Could not find schema id ${e.schemaId} locally, will search on the cluster`);
                this.invocationService.fetchSchema(e.schemaId).then(() => {
                    // Reset nextFrame since we tried to parse the message once.
                    clientMessage.resetNextFrame();
                    this.complete(clientMessage);
                }).catch(err => {
                    this.completeWithError(err);
                });
            }
            else {
                this.completeWithError(e);
            }
        }
    }
    completeWithError(err) {
        this.deferred.reject(err);
        this.invocationService.deregisterInvocation(this.request.getCorrelationId());
    }
}
exports.Invocation = Invocation;
const backupListenerCodec = {
    encodeAddRequest(_localOnly) {
        return ClientLocalBackupListenerCodec_1.ClientLocalBackupListenerCodec.encodeRequest();
    },
    decodeAddResponse(msg) {
        return ClientLocalBackupListenerCodec_1.ClientLocalBackupListenerCodec.decodeResponse(msg);
    },
    encodeRemoveRequest(_listenerId) {
        return null;
    }
};
/**
 * Sends requests to appropriate nodes. Resolves waiting promises with responses.
 * @internal
 */
class InvocationService {
    constructor(clientConfig, 
    // not private since invocations needs access to this
    logger, partitionService, errorFactory, lifecycleService, connectionRegistry, schemaService, serializationService) {
        this.logger = logger;
        this.partitionService = partitionService;
        this.errorFactory = errorFactory;
        this.lifecycleService = lifecycleService;
        this.connectionRegistry = connectionRegistry;
        this.schemaService = schemaService;
        this.serializationService = serializationService;
        this.invocationsWithEventHandlers = new Map();
        this.pending = new Map();
        this.correlationCounter = 1;
        if (clientConfig.network.smartRouting) {
            this.doInvoke = this.invokeSmart;
        }
        else {
            this.doInvoke = this.invokeNonSmart;
        }
        this.invocationRetryPauseMillis =
            clientConfig.properties[PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS];
        this.invocationTimeoutMillis =
            clientConfig.properties[PROPERTY_INVOCATION_TIMEOUT_MILLIS];
        this.operationBackupTimeoutMillis =
            clientConfig.properties[PROPERTY_BACKUP_TIMEOUT_MILLIS];
        this.shouldFailOnIndeterminateState =
            clientConfig.properties[PROPERTY_FAIL_ON_INDETERMINATE_STATE];
        this.cleanResourcesMillis =
            clientConfig.properties[PROPERTY_CLEAN_RESOURCES_MILLIS];
        this.redoOperation = clientConfig.network.redoOperation;
        this.backupAckToClientEnabled = clientConfig.network.smartRouting && clientConfig.backupAckToClientEnabled;
        this.isShutdown = false;
    }
    start(listenerService) {
        this.cleanResourcesTask = this.scheduleCleanResourcesTask(this.cleanResourcesMillis);
        if (this.backupAckToClientEnabled) {
            return listenerService.registerListener(backupListenerCodec, this.backupEventHandler.bind(this)).then(() => { });
        }
        return Promise.resolve();
    }
    scheduleCleanResourcesTask(periodMillis) {
        return (0, Util_1.scheduleWithRepetition)(() => {
            for (const invocation of this.pending.values()) {
                const connection = invocation.sendConnection;
                if (connection === undefined) {
                    continue;
                }
                if (!connection.isAlive()) {
                    this.notifyError(invocation, new core_1.TargetDisconnectedError(connection.getClosedReason()));
                    continue;
                }
                if (this.backupAckToClientEnabled) {
                    invocation.detectAndHandleBackupTimeout(this.operationBackupTimeoutMillis);
                }
            }
        }, periodMillis, periodMillis);
    }
    shutdown() {
        if (this.isShutdown) {
            return;
        }
        this.isShutdown = true;
        if (this.cleanResourcesTask !== undefined) {
            (0, Util_1.cancelRepetitionTask)(this.cleanResourcesTask);
        }
        for (const invocation of this.pending.values()) {
            this.notifyError(invocation, new core_1.ClientNotActiveError('Client is shutting down.'));
        }
    }
    redoOperationEnabled() {
        return this.redoOperation;
    }
    invoke(invocation) {
        invocation.deferred = (0, Util_1.deferredPromise)();
        const newCorrelationId = this.correlationCounter++;
        invocation.request.setCorrelationId(newCorrelationId);
        this.doInvoke(invocation);
        return invocation.deferred.promise;
    }
    invokeUrgent(invocation) {
        invocation.urgent = true;
        return this.invoke(invocation);
    }
    /**
     * Invokes given invocation on specified connection.
     * @param connection
     * @param request
     * @param handler Handler is responsible for handling the client message and returning the object user expects.
     * @returns a promise that resolves to `handler`'s return value.
     */
    invokeOnConnection(connection, request, handler) {
        const invocation = new Invocation(this, request);
        invocation.connection = connection;
        invocation.handler = handler;
        return this.invoke(invocation);
    }
    /**
     * Invokes given invocation on the node that owns given partition.
     * Optionally overrides invocation timeout.
     */
    invokeOnPartition(request, partitionId, handler, timeoutMillis) {
        const invocation = new Invocation(this, request, timeoutMillis);
        invocation.partitionId = partitionId;
        invocation.handler = handler;
        return this.invoke(invocation);
    }
    /**
     * Invokes given invocation on the host with given UUID.
     */
    invokeOnTarget(request, target, handler) {
        const invocation = new Invocation(this, request);
        invocation.uuid = target;
        invocation.handler = handler;
        return this.invoke(invocation);
    }
    /**
     * Invokes given invocation on any host.
     * Useful when an operation is not bound to any host but a generic operation.
     */
    invokeOnRandomTarget(request, handler) {
        const invocation = new Invocation(this, request);
        invocation.handler = handler;
        return this.invoke(invocation);
    }
    /**
     * Removes the handler for all event handlers with a specific correlation id.
     */
    removeEventHandler(correlationId) {
        this.invocationsWithEventHandlers.delete(correlationId);
    }
    backupEventHandler(clientMessage) {
        ClientLocalBackupListenerCodec_1.ClientLocalBackupListenerCodec.handle(clientMessage, (correlationId) => {
            const invocation = this.pending.get(correlationId.toNumber());
            if (invocation === undefined) {
                this.logger.trace('InvocationService', 'Invocation not found for backup event, invocation id '
                    + correlationId);
                return;
            }
            invocation.notifyBackupComplete();
        });
    }
    fetchSchema(schemaId) {
        return this.schemaService.fetchSchema(schemaId);
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    registerSchema(schema, clazz) {
        return this.schemaService.put(schema).then(() => {
            this.serializationService.registerSchemaToClass(schema, clazz);
        });
    }
    callEventHandlerWithMessage(invocation, clientMessage) {
        // We need to retry calling the event handler after fetching the schema if it is not found for the compact case.
        try {
            invocation.eventHandler(clientMessage);
        }
        catch (e) {
            if (!(e instanceof core_1.SchemaNotFoundError)) {
                throw e;
            }
            this.fetchSchemaAndTryAgain(e.schemaId, clientMessage, invocation);
        }
    }
    fetchSchemaAndTryAgain(schemaId, clientMessage, invocation) {
        // We need to fetch the schema to deserialize compact.
        this.logger.trace('InvocationService', `Could not find schema id ${schemaId} locally, will search on the cluster`);
        this.fetchSchema(schemaId).then(() => {
            // Reset nextFrame since we tried to parse the message once.
            clientMessage.resetNextFrame();
            process.nextTick(() => {
                this.callEventHandlerWithMessage(invocation, clientMessage);
            });
        }).catch(err => {
            // TODO: Rethink how to handle this. Maybe we want to call fetchSchemaAndTryAgain again.
            this.logger.error('InvocationService', `Could not fetch schema with id ${schemaId} required for an event handler. Error: ${err}`);
        });
    }
    /**
     * Extracts codec specific properties in a protocol message and resolves waiting promise.
     */
    processResponse(clientMessage) {
        const correlationId = clientMessage.getCorrelationId();
        if (clientMessage.startFrame.hasEventFlag() || clientMessage.startFrame.hasBackupEventFlag()) {
            const invocation = this.invocationsWithEventHandlers.get(correlationId);
            if (invocation !== undefined) {
                process.nextTick(() => {
                    this.callEventHandlerWithMessage(invocation, clientMessage);
                });
            }
            return;
        }
        const pendingInvocation = this.pending.get(correlationId);
        if (pendingInvocation === undefined) {
            if (!this.isShutdown) {
                this.logger.warn('InvocationService', 'Found no registration for invocation id ' + correlationId);
            }
            return;
        }
        const messageType = clientMessage.getMessageType();
        if (messageType === ErrorsCodec_1.EXCEPTION_MESSAGE_TYPE) {
            const remoteError = this.errorFactory.createErrorFromClientMessage(clientMessage);
            this.notifyError(pendingInvocation, remoteError);
        }
        else {
            pendingInvocation.notify(clientMessage);
        }
    }
    invokeSmart(invocation) {
        invocation.invokeCount++;
        if (!invocation.urgent) {
            const error = this.connectionRegistry.checkIfInvocationAllowed();
            if (error !== null) {
                this.notifyError(invocation, error);
                return;
            }
        }
        else {
            const error = this.checkUrgentInvocationAllowed(invocation);
            if (error !== null) {
                this.notifyError(invocation, error);
                return;
            }
        }
        let invocationPromise;
        if (invocation.hasOwnProperty('connection')) {
            invocationPromise = this.send(invocation, invocation.connection);
            invocationPromise.catch((err) => {
                this.notifyError(invocation, err);
            });
            return;
        }
        if (invocation.hasPartitionId()) {
            invocationPromise = this.invokeOnPartitionOwner(invocation, invocation.partitionId);
        }
        else if (invocation.hasOwnProperty('uuid')) {
            invocationPromise = this.invokeOnUuid(invocation, invocation.uuid);
        }
        else {
            invocationPromise = this.invokeOnRandomConnection(invocation);
        }
        invocationPromise.catch(() => {
            return this.invokeOnRandomConnection(invocation);
        }).catch((err) => {
            this.notifyError(invocation, err);
        });
    }
    invokeNonSmart(invocation) {
        invocation.invokeCount++;
        if (!invocation.urgent) {
            const error = this.connectionRegistry.checkIfInvocationAllowed();
            if (error != null) {
                this.notifyError(invocation, error);
                return;
            }
        }
        else {
            const error = this.checkUrgentInvocationAllowed(invocation);
            if (error !== null) {
                this.notifyError(invocation, error);
                return;
            }
        }
        let invocationPromise;
        if (invocation.hasOwnProperty('connection')) {
            invocationPromise = this.send(invocation, invocation.connection);
        }
        else {
            invocationPromise = this.invokeOnRandomConnection(invocation);
        }
        invocationPromise.catch((err) => {
            this.notifyError(invocation, err);
        });
    }
    invokeOnRandomConnection(invocation) {
        const connection = this.connectionRegistry.getRandomConnection();
        if (connection == null) {
            return Promise.reject(new core_1.IOError('No connection found to invoke'));
        }
        return this.send(invocation, connection);
    }
    invokeOnUuid(invocation, target) {
        const connection = this.connectionRegistry.getConnection(target);
        if (connection == null) {
            this.logger.trace('InvocationService', `Client is not connected to target: ${target}`);
            return Promise.reject(new core_1.IOError('No connection found to invoke'));
        }
        return this.send(invocation, connection);
    }
    invokeOnPartitionOwner(invocation, partitionId) {
        const partitionOwner = this.partitionService.getPartitionOwner(partitionId);
        if (partitionOwner == null) {
            this.logger.trace('InvocationService', 'Partition owner is not assigned yet');
            return Promise.reject(new core_1.IOError('No connection found to invoke'));
        }
        return this.invokeOnUuid(invocation, partitionOwner);
    }
    send(invocation, connection) {
        if (this.isShutdown) {
            return Promise.reject(new core_1.ClientNotActiveError('Client is shutting down.'));
        }
        if (this.backupAckToClientEnabled) {
            invocation.request.getStartFrame().addFlag(ClientMessage_1.IS_BACKUP_AWARE_FLAG);
        }
        this.registerInvocation(invocation);
        return connection.write(invocation.request)
            .then(() => {
            invocation.sendConnection = connection;
        });
    }
    notifyError(invocation, error) {
        const correlationId = invocation.request.getCorrelationId();
        if (this.rejectIfNotRetryable(invocation, error)) {
            this.pending.delete(correlationId);
            return;
        }
        this.logger.debug('InvocationService', 'Retrying(' + invocation.invokeCount + ') on correlation-id=' + correlationId, error);
        if (invocation.invokeCount < MAX_FAST_INVOCATION_COUNT) {
            this.doInvoke(invocation);
        }
        else {
            setTimeout(this.doInvoke.bind(this, invocation), this.invocationRetryPauseMillis);
        }
    }
    /**
     * Determines if an error is retryable. The given invocation is rejected with
     * appropriate error if the error is not retryable.
     *
     * @param invocation
     * @param error
     * @returns `true` if invocation is rejected, `false` otherwise
     */
    rejectIfNotRetryable(invocation, error) {
        if (!this.lifecycleService.isRunning()) {
            invocation.deferred.reject(new core_1.ClientNotActiveError('Client is shutting down.', error));
            return true;
        }
        if (!invocation.shouldRetry(error)) {
            invocation.deferred.reject(error);
            return true;
        }
        if (invocation.deadline < Date.now()) {
            this.logger.trace('InvocationService', 'Error will not be retried because invocation timed out');
            invocation.deferred.reject(new core_1.OperationTimeoutError('Invocation '
                + invocation.request.getCorrelationId() + ') reached its deadline.', error));
            return true;
        }
    }
    registerInvocation(invocation) {
        const message = invocation.request;
        const correlationId = message.getCorrelationId();
        if (invocation.hasPartitionId()) {
            message.setPartitionId(invocation.partitionId);
        }
        else {
            message.setPartitionId(-1);
        }
        if (invocation.hasOwnProperty('eventHandler')) {
            this.invocationsWithEventHandlers.set(correlationId, invocation);
        }
        this.pending.set(correlationId, invocation);
    }
    deregisterInvocation(correlationId) {
        this.pending.delete(correlationId);
    }
    /**
     * Returns `true` if we need to check the urgent invocations, by
     * examining the local registry of the schema service.
     */
    shouldCheckUrgentInvocations() {
        return this.schemaService.hasAnySchemas();
    }
    checkUrgentInvocationAllowed(invocation) {
        if (this.connectionRegistry.clientInitializedOnCluster()) {
            // If the client is initialized on the cluster, that means we
            // have sent all the schemas to the cluster, even if we are
            // reconnected to it
            return null;
        }
        if (!this.shouldCheckUrgentInvocations()) {
            // If there were no Compact schemas to begin with, we don't need
            // to perform the check below. If the client didn't send a Compact
            // schema up until this point, the retries or listener registrations
            // could not send a schema, because if they were, we wouldn't hit
            // this line.
            return null;
        }
        // We are not yet initialized on cluster, so the Compact schemas might
        // not be sent yet. This message contains some serialized classes,
        // and it is possible that it can also contain Compact serialized data.
        // In that case, allowing this invocation to go through now could
        // violate the invariant that the schema must come to cluster before
        // the data. We will retry this invocation and wait until the client
        // is initialized on the cluster, which means schemas are replicated
        // in the cluster.
        if (invocation.request.isContainsSerializedDataInRequest()) {
            return new core_1.InvocationMightContainCompactDataError('The invocation with correlation id '
                + invocation.request.getCorrelationId() + ' might contain Compact serialized '
                + 'data and it is not safe to invoke it when the client is not '
                + 'yet initialized on the cluster');
        }
        return null;
    }
}
exports.InvocationService = InvocationService;
//# sourceMappingURL=InvocationService.js.map