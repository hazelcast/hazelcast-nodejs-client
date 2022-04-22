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
/** @ignore *//** */

import {
    ClientNotActiveError, DistributedObjectEvent, DistributedObjectListener,
    HazelcastError,
    IOError,
    TargetDisconnectedError,
    UUID
} from '../core';
import {Connection} from '../network/Connection';
import {Invocation, InvocationService} from '../invocation/InvocationService';
import {ListenerRegistration} from '../invocation/ListenerRegistration';
import {ClientMessage, ClientMessageHandler} from '../protocol/ClientMessage';
import {ListenerMessageCodec} from './ListenerMessageCodec';
import {UuidUtil} from '../util/UuidUtil';
import {ILogger} from '../logging';
import {
    ConnectionManager,
    CONNECTION_ADDED_EVENT_NAME,
    CONNECTION_REMOVED_EVENT_NAME
} from '../network/ConnectionManager';
import {ConnectionRegistration} from '../invocation/ConnectionRegistration';
import {ClientAddDistributedObjectListenerCodec} from '../codec/ClientAddDistributedObjectListenerCodec';
import {ClientRemoveDistributedObjectListenerCodec} from '../codec/ClientRemoveDistributedObjectListenerCodec';

/**
 * Stores, adds and removes listener registrations.
 * @internal
 */
export class ListenerService {

    private readonly registrations: Map<string, ListenerRegistration>;

    constructor(
        private readonly logger: ILogger,
        private readonly isSmartService: boolean,
        private readonly connectionManager: ConnectionManager,
        private readonly invocationService: InvocationService,
    ) {
        this.registrations = new Map();
    }

    start(): void {
        this.connectionManager.on(CONNECTION_ADDED_EVENT_NAME, this.onConnectionAdded.bind(this));
        this.connectionManager.on(CONNECTION_REMOVED_EVENT_NAME, this.onConnectionRemoved.bind(this));
    }

    onConnectionAdded(connection: Connection): void {
        this.reregisterListenersOnConnection(connection);
    }

    onConnectionRemoved(connection: Connection): void {
        this.removeRegistrationsOnConnection(connection);
    }

    reregisterListenersOnConnection(connection: Connection): void {
        this.registrations.forEach((registration, userRegistrationId) => {
            this.invoke(registration, connection, userRegistrationId).catch(err => {
                this.logger.warn('ListenerService', `Listener ${userRegistrationId} can not` +
                    `be added to a new connection: ${connection}, reason: ${err}`);
            });
        }, this);
    }

    removeRegistrationsOnConnection(connection: Connection): void {
        this.registrations.forEach((listenerRegistration) => {
            const connectionRegistration = listenerRegistration.connectionRegistrations.get(connection);
            if (connectionRegistration !== undefined) {
                listenerRegistration.connectionRegistrations.delete(connection);
                this.invocationService.removeEventHandler(connectionRegistration.correlationId);
            }
        });
    }

    invoke(listenerRegistration: ListenerRegistration, connection: Connection, userRegistrationId: string): Promise<void> {
        if (listenerRegistration.connectionRegistrations.has(connection)) {
            return Promise.resolve();
        }
        const codec = listenerRegistration.codec;
        const handler = listenerRegistration.handler;

        const registerRequest = codec.encodeAddRequest(this.isSmart());

        this.logger.trace('ListenerService', `Register attempt of ${listenerRegistration} to ${connection}`);

        const invocation = new Invocation(this.invocationService, registerRequest);
        invocation.eventHandler = handler;
        invocation.connection = connection;

        return this.invocationService.invokeUrgent(invocation)
            .then((responseMessage) => {
                const serverRegistrationId = codec.decodeAddResponse(responseMessage);
                this.logger.trace('ListenerService',
                    'Registered ' + userRegistrationId + ' to ' + connection.toString());
                const correlationId = responseMessage.getCorrelationId();
                const clientEventRegistration = new ConnectionRegistration(serverRegistrationId, correlationId);

                listenerRegistration.connectionRegistrations.set(connection, clientEventRegistration);
            })
            .catch((err) => {
                if (invocation.connection.isAlive()) {
                    this.deregisterListener(userRegistrationId)
                        .catch(() => {
                            // no-op
                        });
                    throw new HazelcastError('Listener cannot be added!', err);
                }
            });
    }

    registerListener(codec: ListenerMessageCodec,
                     listenerHandlerFn: ClientMessageHandler): Promise<string> {
        const userRegistrationId = UuidUtil.generate().toString();

        const listenerRegistration = new ListenerRegistration(listenerHandlerFn, codec);
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

    deregisterListener(userRegistrationId: string): Promise<boolean> {
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
            deregistrationPromises[i] = this.deregisterListenerOnTarget(
                userRegistrationId, listenerRegistration, connectionRegistration.serverRegistrationId, connection
            );
            i++;
        });

        return Promise.all(deregistrationPromises).then(() => true);
    }

    /**
     * Asynchronously de-registers listener on the target associated
     * with the given event registration.
     */
    private deregisterListenerOnTarget(
        userRegistrationId: string, eventRegistration: ListenerRegistration, serverRegistrationId: UUID, connection: Connection
    ): Promise<void> {
        const clientMessage = eventRegistration.codec.encodeRemoveRequest(serverRegistrationId);
        // null message means no remote registration (e.g. for backup acks)
        if (clientMessage === null) {
            return Promise.resolve();
        }
        const invocation = new Invocation(this.invocationService, clientMessage, Number.MAX_SAFE_INTEGER);
        invocation.connection = connection;
        return this.invocationService.invoke(invocation).then(() => {}).catch((err) => {
            if (err instanceof ClientNotActiveError
                    || err instanceof IOError
                    || err instanceof TargetDisconnectedError) {
                return;
            }
            this.logger.warn('ListenerService',
                'Deregistration of listener ' + userRegistrationId + ' has failed for address '
                    + invocation.connection.getRemoteAddress().toString());
        });
    }

    public addDistributedObjectListener(distributedObjectListener: DistributedObjectListener): Promise<string> {
        const handler = (clientMessage: ClientMessage): void => {
            const converterFunc = (objectName: string, serviceName: string, eventType: string): void => {
                eventType = eventType.toLowerCase();
                const distributedObjectEvent = new DistributedObjectEvent(eventType, serviceName, objectName);
                distributedObjectListener(distributedObjectEvent);
            };
            ClientAddDistributedObjectListenerCodec.handle(clientMessage, converterFunc);
        };
        const codec = this.createDistributedObjectListener();
        return this.registerListener(codec, handler);
    }

    private createDistributedObjectListener(): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ClientAddDistributedObjectListenerCodec.encodeRequest(localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ClientAddDistributedObjectListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ClientRemoveDistributedObjectListenerCodec.encodeRequest(listenerId);
            },
        };
    }

    isSmart(): boolean {
        return this.isSmartService;
    }
}
