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
exports.ListenerService = void 0;
const core_1 = require("../core");
const InvocationService_1 = require("../invocation/InvocationService");
const ListenerRegistration_1 = require("../invocation/ListenerRegistration");
const UuidUtil_1 = require("../util/UuidUtil");
const ConnectionManager_1 = require("../network/ConnectionManager");
const ConnectionRegistration_1 = require("../invocation/ConnectionRegistration");
const ClientAddDistributedObjectListenerCodec_1 = require("../codec/ClientAddDistributedObjectListenerCodec");
const ClientRemoveDistributedObjectListenerCodec_1 = require("../codec/ClientRemoveDistributedObjectListenerCodec");
/**
 * Stores, adds and removes listener registrations.
 * @internal
 */
class ListenerService {
    constructor(logger, isSmartService, connectionManager, invocationService) {
        this.logger = logger;
        this.isSmartService = isSmartService;
        this.connectionManager = connectionManager;
        this.invocationService = invocationService;
        this.registrations = new Map();
    }
    start() {
        this.connectionManager.on(ConnectionManager_1.CONNECTION_ADDED_EVENT_NAME, this.onConnectionAdded.bind(this));
        this.connectionManager.on(ConnectionManager_1.CONNECTION_REMOVED_EVENT_NAME, this.onConnectionRemoved.bind(this));
    }
    onConnectionAdded(connection) {
        this.reregisterListenersOnConnection(connection);
    }
    onConnectionRemoved(connection) {
        this.removeRegistrationsOnConnection(connection);
    }
    reregisterListenersOnConnection(connection) {
        this.registrations.forEach((registration, userRegistrationId) => {
            this.invoke(registration, connection, userRegistrationId).catch(err => {
                this.logger.warn('ListenerService', `Listener ${userRegistrationId} can not` +
                    `be added to a new connection: ${connection}, reason: ${err}`);
            });
        }, this);
    }
    removeRegistrationsOnConnection(connection) {
        this.registrations.forEach((listenerRegistration) => {
            const connectionRegistration = listenerRegistration.connectionRegistrations.get(connection);
            if (connectionRegistration !== undefined) {
                listenerRegistration.connectionRegistrations.delete(connection);
                this.invocationService.removeEventHandler(connectionRegistration.correlationId);
            }
        });
    }
    invoke(listenerRegistration, connection, userRegistrationId) {
        if (listenerRegistration.connectionRegistrations.has(connection)) {
            return Promise.resolve();
        }
        const codec = listenerRegistration.codec;
        const handler = listenerRegistration.handler;
        const registerRequest = codec.encodeAddRequest(this.isSmart());
        this.logger.trace('ListenerService', `Register attempt of ${listenerRegistration} to ${connection}`);
        const invocation = new InvocationService_1.Invocation(this.invocationService, registerRequest);
        invocation.eventHandler = handler;
        invocation.connection = connection;
        return this.invocationService.invokeUrgent(invocation)
            .then((responseMessage) => {
            const serverRegistrationId = codec.decodeAddResponse(responseMessage);
            this.logger.trace('ListenerService', 'Registered ' + userRegistrationId + ' to ' + connection.toString());
            const correlationId = responseMessage.getCorrelationId();
            const clientEventRegistration = new ConnectionRegistration_1.ConnectionRegistration(serverRegistrationId, correlationId);
            listenerRegistration.connectionRegistrations.set(connection, clientEventRegistration);
        })
            .catch((err) => {
            if (invocation.connection.isAlive()) {
                this.deregisterListener(userRegistrationId)
                    .catch(() => {
                    // no-op
                });
                throw new core_1.HazelcastError('Listener cannot be added!', err);
            }
        });
    }
    registerListener(codec, listenerHandlerFn) {
        const userRegistrationId = UuidUtil_1.UuidUtil.generate().toString();
        const listenerRegistration = new ListenerRegistration_1.ListenerRegistration(listenerHandlerFn, codec);
        this.registrations.set(userRegistrationId, listenerRegistration);
        const activeConnections = this.connectionManager.getConnectionRegistry().getConnections();
        const registrationPromises = [];
        for (const connection of activeConnections) {
            const registrationPromise = this.invoke(listenerRegistration, connection, userRegistrationId);
            registrationPromises.push(registrationPromise);
        }
        return Promise.all(registrationPromises)
            .then(() => userRegistrationId);
    }
    deregisterListener(userRegistrationId) {
        const listenerRegistration = this.registrations.get(userRegistrationId);
        if (listenerRegistration === undefined) {
            return Promise.resolve(false);
        }
        const connectionRegistrations = listenerRegistration.connectionRegistrations;
        const deregistrationPromises = new Array(connectionRegistrations.size);
        let i = 0;
        connectionRegistrations.forEach((connectionRegistration, connection) => {
            // remove local handler
            this.invocationService.removeEventHandler(connectionRegistration.correlationId);
            // the rest is for deleting remote registration
            deregistrationPromises[i] = this.deregisterListenerOnTarget(userRegistrationId, listenerRegistration, connectionRegistration.serverRegistrationId, connection);
            i++;
        });
        return Promise.all(deregistrationPromises).then(() => true);
    }
    /**
     * Asynchronously de-registers listener on the target associated
     * with the given event registration.
     */
    deregisterListenerOnTarget(userRegistrationId, eventRegistration, serverRegistrationId, connection) {
        const clientMessage = eventRegistration.codec.encodeRemoveRequest(serverRegistrationId);
        // null message means no remote registration (e.g. for backup acks)
        if (clientMessage === null) {
            return Promise.resolve();
        }
        const invocation = new InvocationService_1.Invocation(this.invocationService, clientMessage, Number.MAX_SAFE_INTEGER);
        invocation.connection = connection;
        return this.invocationService.invoke(invocation).then(() => { }).catch((err) => {
            if (err instanceof core_1.ClientNotActiveError
                || err instanceof core_1.IOError
                || err instanceof core_1.TargetDisconnectedError) {
                return;
            }
            this.logger.warn('ListenerService', 'Deregistration of listener ' + userRegistrationId + ' has failed for address '
                + invocation.connection.getRemoteAddress().toString());
        });
    }
    addDistributedObjectListener(distributedObjectListener) {
        const handler = (clientMessage) => {
            const converterFunc = (objectName, serviceName, eventType) => {
                eventType = eventType.toLowerCase();
                const distributedObjectEvent = new core_1.DistributedObjectEvent(eventType, serviceName, objectName);
                distributedObjectListener(distributedObjectEvent);
            };
            ClientAddDistributedObjectListenerCodec_1.ClientAddDistributedObjectListenerCodec.handle(clientMessage, converterFunc);
        };
        const codec = this.createDistributedObjectListener();
        return this.registerListener(codec, handler);
    }
    createDistributedObjectListener() {
        return {
            encodeAddRequest(localOnly) {
                return ClientAddDistributedObjectListenerCodec_1.ClientAddDistributedObjectListenerCodec.encodeRequest(localOnly);
            },
            decodeAddResponse(msg) {
                return ClientAddDistributedObjectListenerCodec_1.ClientAddDistributedObjectListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return ClientRemoveDistributedObjectListenerCodec_1.ClientRemoveDistributedObjectListenerCodec.encodeRequest(listenerId);
            },
        };
    }
    isSmart() {
        return this.isSmartService;
    }
}
exports.ListenerService = ListenerService;
//# sourceMappingURL=ListenerService.js.map