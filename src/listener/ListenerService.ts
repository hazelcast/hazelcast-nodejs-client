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
/** @ignore *//** */

import {
    ClientNotActiveError,
    HazelcastError,
    IOError,
    TargetDisconnectedError
} from '../core';
import {Connection} from '../network/Connection';
import {ClientEventRegistration} from '../invocation/ClientEventRegistration';
import {Invocation, InvocationService} from '../invocation/InvocationService';
import {RegistrationKey} from '../invocation/RegistrationKey';
import {ClientMessageHandler} from '../protocol/ClientMessage';
import {ListenerMessageCodec} from './ListenerMessageCodec';
import {UuidUtil} from '../util/UuidUtil';
import {ILogger} from '../logging';
import {ConnectionRegistry} from '../network/ConnectionRegistry';
import {
    ConnectionManager,
    CONNECTION_ADDED_EVENT_NAME,
    CONNECTION_REMOVED_EVENT_NAME
} from '../network/ConnectionManager';

/** @internal */
export class ListenerService {

    private readonly activeRegistrations: Map<string, Map<Connection, ClientEventRegistration>>;
    private readonly userKeyInformation: Map<string, RegistrationKey>;

    constructor(
        private readonly logger: ILogger,
        private readonly isSmartService: boolean,
        private readonly connectionManager: ConnectionManager,
        private readonly invocationService: InvocationService,
        private readonly connectionRegistry: ConnectionRegistry
    ) {
        this.activeRegistrations = new Map();
        this.userKeyInformation = new Map();
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
        this.activeRegistrations.forEach((registrationMap, userKey) => {
            if (registrationMap.has(connection)) {
                return;
            }
            this.invokeRegistrationFromRecord(userKey, connection).then((eventRegistration) => {
                // handle potential race with deregisterListener
                // which might have deleted the registration
                if (this.userKeyInformation.get(userKey) === undefined) {
                    this.deregisterListenerOnTarget(userKey, eventRegistration);
                    return;
                }
                registrationMap.set(connection, eventRegistration);
            }).catch((err) => {
                this.logger.warn('ListenerService', err);
            });
        }, this);
    }

    removeRegistrationsOnConnection(connection: Connection): void {
        this.activeRegistrations.forEach((registrationsOnUserKey) => {
            const eventRegistration = registrationsOnUserKey.get(connection);
            if (eventRegistration !== undefined) {
                registrationsOnUserKey.delete(connection);
                this.invocationService.removeEventHandler(eventRegistration.correlationId);
            }
        });
    }

    invokeRegistrationFromRecord(userKey: string, connection: Connection): Promise<ClientEventRegistration> {
        const activeRegsOnUserKey = this.activeRegistrations.get(userKey);
        if (activeRegsOnUserKey !== undefined && activeRegsOnUserKey.has(connection)) {
            return Promise.resolve(activeRegsOnUserKey.get(connection));
        }
        const registrationKey = this.userKeyInformation.get(userKey);
        // New correlation id will be set on the invoke call
        const registerRequest = registrationKey.getRegisterRequest().copyWithNewCorrelationId();
        const codec = registrationKey.getCodec();
        const invocation = new Invocation(this.invocationService, registerRequest);
        invocation.handler = registrationKey.getHandler() as any;
        invocation.connection = connection;
        return this.invocationService.invokeUrgent(invocation).then((responseMessage) => {
            const correlationId = responseMessage.getCorrelationId();
            const response = codec.decodeAddResponse(responseMessage);
            const eventRegistration = new ClientEventRegistration(response, correlationId, invocation.connection, codec);
            this.logger.debug('ListenerService',
                'Listener ' + userKey + ' re-registered on ' + connection.toString());
            return eventRegistration;
        }).catch(((err) => {
            throw new HazelcastError(`Could not add listener[${userKey}] to connection[${connection}]`, err);
        }));
    }

    registerListener(codec: ListenerMessageCodec,
                     listenerHandlerFn: ClientMessageHandler): Promise<string> {
        const activeConnections = this.connectionRegistry.getConnections();
        const userKey = UuidUtil.generate().toString();
        let connectionsOnUserKey: Map<Connection, ClientEventRegistration>;
        const registerRequest = codec.encodeAddRequest(this.isSmart());
        connectionsOnUserKey = this.activeRegistrations.get(userKey);
        if (connectionsOnUserKey === undefined) {
            connectionsOnUserKey = new Map();
            this.activeRegistrations.set(userKey, connectionsOnUserKey);
            this.userKeyInformation.set(userKey,
                new RegistrationKey(userKey, codec, registerRequest, listenerHandlerFn));
        }

        const registrationPromises = [];
        for (const connection of activeConnections) {
            if (connectionsOnUserKey.has(connection)) {
                continue;
            }

            // new correlation id will be set on the invoke call
            const requestCopy = registerRequest.copyWithNewCorrelationId();
            const invocation = new Invocation(this.invocationService, requestCopy);
            invocation.handler = listenerHandlerFn as any;
            invocation.connection = connection;

            const registrationPromise = this.invocationService.invokeUrgent(invocation)
                .then((responseMessage) => {
                    const correlationId = responseMessage.getCorrelationId();
                    const response = codec.decodeAddResponse(responseMessage);
                    const clientEventRegistration = new ClientEventRegistration(
                        response, correlationId, invocation.connection, codec);
                    this.logger.debug('ListenerService',
                        'Listener ' + userKey + ' registered on ' + invocation.connection.toString());
                    connectionsOnUserKey.set(connection, clientEventRegistration);
                })
                .catch((err) => {
                    if (invocation.connection.isAlive()) {
                        this.deregisterListener(userKey)
                            .catch(() => {
                                // no-op
                            });
                        throw new HazelcastError('Listener cannot be added!', err);
                    }
                });
            registrationPromises.push(registrationPromise);
        }
        return Promise.all(registrationPromises)
            .then(() => userKey);
    }

    deregisterListener(userKey: string): Promise<boolean> {
        const registrationsOnUserKey = this.activeRegistrations.get(userKey);
        if (registrationsOnUserKey === undefined) {
            return Promise.resolve(false);
        }

        this.activeRegistrations.delete(userKey);
        this.userKeyInformation.delete(userKey);

        registrationsOnUserKey.forEach((eventRegistration, connection) => {
            // remove local handler
            registrationsOnUserKey.delete(connection);
            this.invocationService.removeEventHandler(eventRegistration.correlationId);
            // the rest is for deleting remote registration
            this.deregisterListenerOnTarget(userKey, eventRegistration);
        });

        return Promise.resolve(true);
    }

    /**
     * Asynchronously de-registers listener on the target associated
     * with the given event registration.
     */
    private deregisterListenerOnTarget(userKey: string,
                                       eventRegistration: ClientEventRegistration): void {
        const clientMessage = eventRegistration.codec.encodeRemoveRequest(eventRegistration.serverRegistrationId);
        // null message means no remote registration (e.g. for backup acks)
        if (clientMessage === null) {
            return;
        }
        const invocation = new Invocation(this.invocationService, clientMessage, Number.MAX_SAFE_INTEGER);
        invocation.connection = eventRegistration.subscriber;
        this.invocationService.invoke(invocation).catch((err) => {
            if (err instanceof ClientNotActiveError
                    || err instanceof IOError
                    || err instanceof TargetDisconnectedError) {
                return;
            }
            this.logger.warn('ListenerService',
                'Deregistration of listener ' + userKey + ' has failed for address '
                    + invocation.connection.getRemoteAddress().toString());
        });
    }

    isSmart(): boolean {
        return this.isSmartService;
    }
}
