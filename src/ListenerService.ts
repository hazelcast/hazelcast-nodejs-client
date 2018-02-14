/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {ConnectionHeartbeatListener} from './core/ConnectionHeartbeatListener';
import HazelcastClient from './HazelcastClient';
import {EventEmitter} from 'events';
import {LoggingService} from './logging/LoggingService';
import {ClientEventRegistration} from './invocation/ClientEventRegistration';
import {RegistrationKey} from './invocation/RegistrationKey';
import {HazelcastError} from './HazelcastError';
import {copyObjectShallow} from './Util';
import {UuidUtil} from './util/UuidUtil';
import * as Promise from 'bluebird';
import {Invocation} from './invocation/InvocationService';
import {Member} from './core/Member';
import * as assert from 'assert';
import {ListenerMessageCodec} from './ListenerMessageCodec';
import {ClientConnection} from './invocation/ClientConnection';

export class ListenerService implements ConnectionHeartbeatListener {
    private client: HazelcastClient;
    private internalEventEmitter: EventEmitter;
    private logger = LoggingService.getLoggingService();
    private isShutdown: boolean;
    private isSmartService: boolean;

    private activeRegistrations: Map<string, Map<ClientConnection, ClientEventRegistration>>;
    private failedRegistrations: Map<ClientConnection, Set<string>>;
    private userRegistrationKeyInformation: Map<string, RegistrationKey>;
    private connectionRefreshTask: any;
    private connectionRefreshTaskInterval: number;

    constructor(client: HazelcastClient) {
        this.isShutdown = false;
        this.client = client;
        this.isSmartService = this.client.getConfig().networkConfig.smartRouting;
        this.internalEventEmitter = new EventEmitter();
        this.internalEventEmitter.setMaxListeners(0);
        this.activeRegistrations = new Map();
        this.failedRegistrations = new Map();
        this.userRegistrationKeyInformation = new Map();
        this.connectionRefreshTaskInterval = 2000;
    }

    start() {
        this.client.getConnectionManager().on('connectionOpened', this.onConnectionAdded.bind(this));
        this.client.getConnectionManager().on('connectionClosed', this.onConnectionRemoved.bind(this));
        if (this.isSmart() ) {
            this.connectionRefreshTask = this.connectionRefreshHandler();
        }
    }

    protected connectionRefreshHandler(): void {
        if (this.isShutdown) {
            return;
        }
        this.trySyncConnectToAllConnections().catch((e) => {/*no-op*/}).finally(() => {
            this.connectionRefreshTask =
                setTimeout(this.connectionRefreshHandler.bind(this), this.connectionRefreshTaskInterval);
        });
    }

    onConnectionAdded(connection: ClientConnection) {
        this.reregisterListenersOnConnection(connection);

    }

    onConnectionRemoved(connection: ClientConnection) {
        this.removeRegistrationsOnConnection(connection);
    }

    onHeartbeatRestored(connection: ClientConnection): void {
        var failedRegistrationsOnConn: Set<string> = this.failedRegistrations.get(connection);
        failedRegistrationsOnConn.forEach((userKey: string, ignored: string) => {
            this.invokeRegistrationFromRecord(userKey, connection);
        });
    }

    reregisterListeners() {
        var connections = this.client.getConnectionManager().getActiveConnections();
        for (var connAddress in connections) {
            this.reregisterListenersOnConnection(connections[connAddress]);
        }
    }

    reregisterListenersOnConnection(connection: ClientConnection) {
        this.activeRegistrations.forEach((registrationMap: Map<ClientConnection, ClientEventRegistration>, userKey: string) => {
            if (registrationMap.has(connection)) {
                return;
            }
            this.invokeRegistrationFromRecord(userKey, connection).then((eventRegistration: ClientEventRegistration) => {
                registrationMap.set(connection, eventRegistration);
            }).catch((e) => {
                this.logger.warn('ListenerService', e);
            });
        }, this);
    }

    removeRegistrationsOnConnection(connection: ClientConnection) {
        this.failedRegistrations.delete(connection);
        this.activeRegistrations.forEach((registrationsOnUserKey: Map<ClientConnection, ClientEventRegistration>,
                                          userKey: string) => {
            var eventRegistration: ClientEventRegistration = registrationsOnUserKey.get(connection);
            if (eventRegistration !== undefined) {
                this.client.getInvocationService().removeEventHandler(eventRegistration.correlationId.toNumber());
            }
        });
    }

    invokeRegistrationFromRecord(userRegistrationKey: string, connection: ClientConnection): Promise<ClientEventRegistration> {
        let deferred = Promise.defer<ClientEventRegistration>();
        let activeRegsOnUserKey = this.activeRegistrations.get(userRegistrationKey);
        if (activeRegsOnUserKey !== undefined && activeRegsOnUserKey.has(connection)) {
            deferred.resolve(activeRegsOnUserKey.get(connection));
            return deferred.promise;
        }
        let registrationKey = this.userRegistrationKeyInformation.get(userRegistrationKey);
        let registerRequest = registrationKey.getRegisterRequest();
        let codec = registrationKey.getCodec();
        let invocation = new Invocation(this.client, registerRequest);
        invocation.handler = <any>registrationKey.getHandler();
        invocation.connection = connection;
        this.client.getInvocationService().invoke(invocation).then((responseMessage) => {
            var correlationId = responseMessage.getCorrelationId();
            var response = codec.decodeAddResponse(responseMessage);
            var eventRegistration = new ClientEventRegistration(response, correlationId, invocation.connection, codec);
            this.logger.debug('ListenerService',
                'Listener ' + userRegistrationKey + ' re-registered on ' + connection.toString());

            deferred.resolve(eventRegistration);
        }).catch((e => {
            var failedRegsOnConnection = this.failedRegistrations.get(connection);
            if (failedRegsOnConnection === undefined) {
                failedRegsOnConnection = new Set<string>();
                failedRegsOnConnection.add(userRegistrationKey);
                this.failedRegistrations.set(connection, failedRegsOnConnection);
            } else {
                failedRegsOnConnection.add(userRegistrationKey);
            }
            deferred.reject(new HazelcastError('Could not add listener[' + userRegistrationKey +
                '] to connection[' + connection.toString() + ']', e));
        }));
        return deferred.promise;
    }

    registerListener(codec: ListenerMessageCodec, registerHandlerFunc: any): Promise<string> {
        let readyToRegisterPromise: Promise<void>;
        if (this.isSmart()) {
            readyToRegisterPromise = this.trySyncConnectToAllConnections();
        } else {
            //No need for preparation, just return a resolved promise
            readyToRegisterPromise = Promise.resolve();
        }
        return readyToRegisterPromise.then(() => {
            return this.registerListenerInternal(codec, registerHandlerFunc);
        });
    }

    protected registerListenerInternal(codec: ListenerMessageCodec, listenerHandlerFunc: Function): Promise<string> {
        let activeConnections = copyObjectShallow(this.client.getConnectionManager().getActiveConnections());
        let userRegistrationKey: string = UuidUtil.generate().toString();
        let connectionsOnUserKey: Map<ClientConnection, ClientEventRegistration>;
        let deferred = Promise.defer<string>();
        let registerRequest = codec.encodeAddRequest(this.isSmart());
        connectionsOnUserKey = this.activeRegistrations.get(userRegistrationKey);
        if (connectionsOnUserKey === undefined) {
            connectionsOnUserKey = new Map();
            this.activeRegistrations.set(userRegistrationKey, connectionsOnUserKey);
            this.userRegistrationKeyInformation.set(userRegistrationKey,
                new RegistrationKey(userRegistrationKey, codec, registerRequest, listenerHandlerFunc));
        }
        for (let address in activeConnections) {
            if (connectionsOnUserKey.has(activeConnections[address])) {
                continue;
            }
            let invocation = new Invocation(this.client, registerRequest);
            invocation.handler = <any>listenerHandlerFunc;
            invocation.connection = activeConnections[address];
            this.client.getInvocationService().invoke(invocation).then((responseMessage) => {
                let correlationId = responseMessage.getCorrelationId();
                let response = codec.decodeAddResponse(responseMessage);
                let clientEventRegistration = new ClientEventRegistration(response, correlationId, invocation.connection, codec);
                this.logger.debug('ListenerService',
                    'Listener ' + userRegistrationKey + ' registered on ' + invocation.connection.toString());
                connectionsOnUserKey.set(activeConnections[address], clientEventRegistration);
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
        let deferred = Promise.defer<boolean>();
        let registrationsOnUserKey = this.activeRegistrations.get(userRegistrationKey);
        if (registrationsOnUserKey === undefined) {
            deferred.resolve(false);
            return deferred.promise;
        }
        registrationsOnUserKey.forEach((eventRegistration: ClientEventRegistration, connection: ClientConnection) => {
            let clientMessage = eventRegistration.codec.encodeRemoveRequest(eventRegistration.serverRegistrationId);
            let invocation = new Invocation(this.client, clientMessage);
            invocation.connection = eventRegistration.subscriber;
            this.client.getInvocationService().invoke(invocation).then((responseMessage) => {
                registrationsOnUserKey.delete(connection);
                this.client.getInvocationService().removeEventHandler(eventRegistration.correlationId.low);
                this.logger.debug('ListenerService',
                    'Listener ' + userRegistrationKey + ' unregistered from ' + invocation.connection.toString());
                this.activeRegistrations.delete(userRegistrationKey);
                this.userRegistrationKeyInformation.delete(userRegistrationKey);
                deferred.resolve(true);
            });
        });

        return deferred.promise;
    }

    private trySyncConnectToAllConnections(): Promise<void> {
        assert(this.isSmart());
        var members = this.client.getClusterService().getMembers();
        var promises: Promise<ClientConnection>[] = [];
        members.forEach((member: Member) => {
            promises.push(this.client.getConnectionManager().getOrConnect(member.address));
        });
        return Promise.all(promises).thenReturn();
    }

    isSmart(): boolean {
        return this.isSmartService;
    }

    shutdown(): void {
        this.isShutdown = true;
        clearTimeout(this.connectionRefreshTask);
    }
}
