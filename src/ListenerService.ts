import {ConnectionHeartbeatListener} from './core/ConnectionHeartbeatListener';
import HazelcastClient from './HazelcastClient';
import {EventEmitter} from 'events';
import {LoggingService} from './logging/LoggingService';
import ClientConnection = require('./invocation/ClientConnection');
import {ClientEventRegistration} from './invocation/ClientEventRegistration';
import {RegistrationKey} from './invocation/RegistrationKey';
import {HazelcastError} from './HazelcastError';
import {copyObjectShallow} from './Util';
import {UuidUtil} from './util/UuidUtil';
import * as Promise from 'bluebird';
import {Invocation} from './invocation/InvocationService';
import {Member} from './core/Member';
import ClientMessage = require('./ClientMessage');

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
        this.connectionRefreshTask = this.connectionRefreshHandler();
    }

    protected connectionRefreshHandler(): void {
        if (this.isShutdown) {
            return;
        }
        this.trySyncConnectToAllConnections().finally(() => {
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
        let registerDecodeFunc = registrationKey.getDecoder();
        let invocation = new Invocation(this.client, registerRequest);
        invocation.handler = <any>registrationKey.getHandler();
        invocation.connection = connection;
        this.client.getInvocationService().invoke(invocation).then((responseMessage) => {
            var correlationId = responseMessage.getCorrelationId();
            var response = registerDecodeFunc(responseMessage);
            var eventRegistration = new ClientEventRegistration(response.response, correlationId, invocation.connection);
            this.logger.debug('ListenerService',
                'Listener ' + userRegistrationKey + ' re-registered on ' + connection.address.toString());

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

    registerListener(registerRequest: ClientMessage, registerHandlerFunc: any, registerDecodeFunc: any): Promise<string> {
        return this.trySyncConnectToAllConnections().then(() => {
            return this.registerListenerInternal(registerRequest, registerHandlerFunc, registerDecodeFunc);
        });
    }

    protected registerListenerInternal(registerRequest: ClientMessage,
                                       listenerHandlerFunc: Function, registerDecodeFunc: Function): Promise<string> {
        let activeConnections = copyObjectShallow(this.client.getConnectionManager().getActiveConnections());
        let userRegistrationKey: string = UuidUtil.generate();
        let connectionsOnUserKey: Map<ClientConnection, ClientEventRegistration>;
        let deferred = Promise.defer<string>();
        connectionsOnUserKey = this.activeRegistrations.get(userRegistrationKey);
        if (connectionsOnUserKey === undefined) {
            connectionsOnUserKey = new Map();
            this.activeRegistrations.set(userRegistrationKey, connectionsOnUserKey);
            this.userRegistrationKeyInformation.set(userRegistrationKey,
                new RegistrationKey(userRegistrationKey, registerRequest, registerDecodeFunc, listenerHandlerFunc));
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
                let response = registerDecodeFunc(responseMessage);
                let clientEventRegistration = new ClientEventRegistration(response.response,
                    correlationId, invocation.connection);
                this.logger.debug('ListenerService',
                    'Listener ' + userRegistrationKey + ' registered on ' + invocation.connection.address.toString());
                connectionsOnUserKey.set(activeConnections[address], clientEventRegistration);
            }).then(() => {
                deferred.resolve(userRegistrationKey);
            }).catch((e) => {
                let err = new HazelcastError('Listener registration failed on ' + address.toString() + '\n' +
                    e + e.stack);
                this.logger.warn('ListenerService', err.toString());
            });
        }
        return deferred.promise;
    }

    deregisterListener(deregisterEncodeFunc: Function, deregisterDecodeFunc: Function,
                       userRegistrationKey: string): Promise<boolean> {
        let deferred = Promise.defer<boolean>();
        let registrationsOnUserKey = this.activeRegistrations.get(userRegistrationKey);
        if (registrationsOnUserKey === undefined) {
            deferred.resolve(false);
            return deferred.promise;
        }
        registrationsOnUserKey.forEach((eventRegistration: ClientEventRegistration, connection: ClientConnection) => {
            let invocation = new Invocation(this.client, deregisterEncodeFunc(eventRegistration.serverRegistrationId));
            invocation.connection = eventRegistration.subscriber;
            this.client.getInvocationService().invoke(invocation).then((responseMessage) => {
                registrationsOnUserKey.delete(connection);
                this.client.getInvocationService().removeEventHandler(eventRegistration.correlationId.low);
                this.logger.debug('ListenerService',
                    'Listener ' + userRegistrationKey + ' unregistered from ' + invocation.connection.address.toString());

                var response = deregisterDecodeFunc(responseMessage);
                deferred.resolve(response.response);
            }).then(() => {
                this.activeRegistrations.delete(userRegistrationKey);
                this.userRegistrationKeyInformation.delete(userRegistrationKey);
            });
        });

        return deferred.promise;
    }

    private trySyncConnectToAllConnections(): Promise<void> {
        if (this.isSmart()) {
            var members = this.client.getClusterService().getMembers();
            var promises: Promise<ClientConnection>[] = [];
            members.forEach((member: Member) => {
                promises.push(this.client.getConnectionManager().getOrConnect(member.address));
            });
            return Promise.all(promises).thenReturn();
        } else {
            let owner = this.client.getClusterService().getOwnerConnection();
            return this.client.getConnectionManager().getOrConnect(owner.address).thenReturn();
        }
    }

    isSmart(): boolean {
        return this.isSmartService;
    }

    isLocalOnlyListener(): boolean {
        return this.isSmart();
    }

    shutdown(): void {
        this.isShutdown = true;
        clearTimeout(this.connectionRefreshTask);
    }
}
