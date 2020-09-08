/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {HazelcastClient} from '../HazelcastClient';
import {HazelcastError} from '../core';
import {ClientConnection} from '../network/ClientConnection';
import {ClientEventRegistration} from '../invocation/ClientEventRegistration';
import {Invocation} from '../invocation/InvocationService';
import {RegistrationKey} from '../invocation/RegistrationKey';
import {ClientMessageHandler} from '../protocol/ClientMessage';
import {ListenerMessageCodec} from './ListenerMessageCodec';
import {deferredPromise} from '../util/Util';
import {UuidUtil} from '../util/UuidUtil';
import {ILogger} from '../logging/ILogger';

/** @internal */
export class ListenerService {

    private client: HazelcastClient;
    private logger: ILogger;
    private isSmartService: boolean;

    private activeRegistrations: Map<string, Map<ClientConnection, ClientEventRegistration>>;
    private userRegistrationKeyInformation: Map<string, RegistrationKey>;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.logger = this.client.getLoggingService().getLogger();
        this.isSmartService = this.client.getConfig().network.smartRouting;
        this.activeRegistrations = new Map();
        this.userRegistrationKeyInformation = new Map();
    }

    start(): void {
        this.client.getConnectionManager().on('connectionAdded', this.onConnectionAdded.bind(this));
        this.client.getConnectionManager().on('connectionRemoved', this.onConnectionRemoved.bind(this));
    }

    onConnectionAdded(connection: ClientConnection): void {
        this.reregisterListenersOnConnection(connection);
    }

    onConnectionRemoved(connection: ClientConnection): void {
        this.removeRegistrationsOnConnection(connection);
    }

    reregisterListeners(): void {
        const connections = this.client.getConnectionManager().getActiveConnections();
        for (const connAddress in connections) {
            this.reregisterListenersOnConnection(connections[connAddress]);
        }
    }

    reregisterListenersOnConnection(connection: ClientConnection): void {
        this.activeRegistrations.forEach((registrationMap, userKey) => {
            if (registrationMap.has(connection)) {
                return;
            }
            this.invokeRegistrationFromRecord(userKey, connection).then((eventRegistration) => {
                registrationMap.set(connection, eventRegistration);
            }).catch((e) => {
                this.logger.warn('ListenerService', e);
            });
        }, this);
    }

    removeRegistrationsOnConnection(connection: ClientConnection): void {
        this.activeRegistrations.forEach((registrationsOnUserKey) => {
            const eventRegistration = registrationsOnUserKey.get(connection);
            if (eventRegistration !== undefined) {
                this.client.getInvocationService().removeEventHandler(eventRegistration.correlationId);
            }
        });
    }

    invokeRegistrationFromRecord(userRegistrationKey: string, connection: ClientConnection): Promise<ClientEventRegistration> {
        const deferred = deferredPromise<ClientEventRegistration>();
        const activeRegsOnUserKey = this.activeRegistrations.get(userRegistrationKey);
        if (activeRegsOnUserKey !== undefined && activeRegsOnUserKey.has(connection)) {
            deferred.resolve(activeRegsOnUserKey.get(connection));
            return deferred.promise;
        }
        const registrationKey = this.userRegistrationKeyInformation.get(userRegistrationKey);
        // New correlation id will be set on the invoke call
        const registerRequest = registrationKey.getRegisterRequest().copyWithNewCorrelationId();
        const codec = registrationKey.getCodec();
        const invocation = new Invocation(this.client, registerRequest);
        invocation.handler = registrationKey.getHandler() as any;
        invocation.connection = connection;
        this.client.getInvocationService().invokeUrgent(invocation).then((responseMessage) => {
            const correlationId = responseMessage.getCorrelationId();
            const response = codec.decodeAddResponse(responseMessage);
            const eventRegistration = new ClientEventRegistration(response, correlationId, invocation.connection, codec);
            this.logger.debug('ListenerService',
                'Listener ' + userRegistrationKey + ' re-registered on ' + connection.toString());

            deferred.resolve(eventRegistration);
        }).catch(((e) => {
            deferred.reject(new HazelcastError('Could not add listener[' + userRegistrationKey +
                '] to connection[' + connection.toString() + ']', e));
        }));
        return deferred.promise;
    }

    registerListener(codec: ListenerMessageCodec,
                     listenerHandlerFn: ClientMessageHandler): Promise<string> {
        const activeConnections = this.client.getConnectionManager().getActiveConnections();
        const userRegistrationKey = UuidUtil.generate().toString();
        let connectionsOnUserKey: Map<ClientConnection, ClientEventRegistration>;
        const deferred = deferredPromise<string>();
        const registerRequest = codec.encodeAddRequest(this.isSmart());
        connectionsOnUserKey = this.activeRegistrations.get(userRegistrationKey);
        if (connectionsOnUserKey === undefined) {
            connectionsOnUserKey = new Map();
            this.activeRegistrations.set(userRegistrationKey, connectionsOnUserKey);
            this.userRegistrationKeyInformation.set(userRegistrationKey,
                new RegistrationKey(userRegistrationKey, codec, registerRequest, listenerHandlerFn));
        }
        for (const connection of activeConnections) {
            if (connectionsOnUserKey.has(connection)) {
                continue;
            }
            // new correlation id will be set on the invoke call
            const requestCopy = registerRequest.copyWithNewCorrelationId();
            const invocation = new Invocation(this.client, requestCopy);
            invocation.handler = listenerHandlerFn as any;
            invocation.connection = connection;
            this.client.getInvocationService().invokeUrgent(invocation).then((responseMessage) => {
                const correlationId = responseMessage.getCorrelationId();
                const response = codec.decodeAddResponse(responseMessage);
                const clientEventRegistration = new ClientEventRegistration(
                    response, correlationId, invocation.connection, codec);
                this.logger.debug('ListenerService',
                    'Listener ' + userRegistrationKey + ' registered on ' + invocation.connection.toString());
                connectionsOnUserKey.set(connection, clientEventRegistration);
            }).then(() => {
                deferred.resolve(userRegistrationKey);
            }).catch((e) => {
                if (invocation.connection.isAlive()) {
                    this.deregisterListener(userRegistrationKey);
                    deferred.reject(new HazelcastError('Listener cannot be added!', e));
                }
            });
        }
        return deferred.promise;
    }

    deregisterListener(userRegistrationKey: string): Promise<boolean> {
        const deferred = deferredPromise<boolean>();
        const registrationsOnUserKey = this.activeRegistrations.get(userRegistrationKey);
        if (registrationsOnUserKey === undefined) {
            deferred.resolve(false);
            return deferred.promise;
        }
        registrationsOnUserKey.forEach((eventRegistration: ClientEventRegistration, connection: ClientConnection) => {
            const clientMessage = eventRegistration.codec.encodeRemoveRequest(eventRegistration.serverRegistrationId);
            const invocation = new Invocation(this.client, clientMessage);
            invocation.connection = eventRegistration.subscriber;
            this.client.getInvocationService().invoke(invocation).then((responseMessage) => {
                registrationsOnUserKey.delete(connection);
                this.client.getInvocationService().removeEventHandler(eventRegistration.correlationId);
                this.logger.debug('ListenerService',
                    'Listener ' + userRegistrationKey + ' unregistered from ' + invocation.connection.toString());
                this.activeRegistrations.delete(userRegistrationKey);
                this.userRegistrationKeyInformation.delete(userRegistrationKey);
                deferred.resolve(true);
            });
        });

        return deferred.promise;
    }

    isSmart(): boolean {
        return this.isSmartService;
    }
}
