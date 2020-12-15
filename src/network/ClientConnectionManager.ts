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

import {EventEmitter} from 'events';
import {HazelcastClient} from '../HazelcastClient';
import {
    AuthenticationError,
    ClientNotActiveError,
    ClientNotAllowedInClusterError,
    ClientOfflineError,
    HazelcastError,
    IllegalStateError,
    InvalidConfigurationError,
    IOError,
    UUID,
    LoadBalancer,
    AddressImpl,
    MemberImpl
} from '../core';
import {lookupPublicAddress} from '../core/MemberInfo';
import {ClientConnection} from './ClientConnection';
import * as net from 'net';
import * as tls from 'tls';
import {
    AddressHelper,
    cancelRepetitionTask,
    deferredPromise,
    DeferredPromise,
    scheduleWithRepetition,
    shuffleArray,
    Task,
    timedPromise
} from '../util/Util';
import {BasicSSLOptionsFactory} from '../connection/BasicSSLOptionsFactory';
import {ILogger} from '../logging/ILogger';
import {HeartbeatManager} from './HeartbeatManager';
import {UuidUtil} from '../util/UuidUtil';
import {WaitStrategy} from './WaitStrategy';
import {ReconnectMode} from '../config/ConnectionStrategyConfig';
import {ClientConfigImpl} from '../config/Config';
import {LifecycleState, LifecycleServiceImpl} from '../LifecycleService';
import {ClientMessage} from '../protocol/ClientMessage';
import {BuildInfo} from '../BuildInfo';
import {ClientAuthenticationCustomCodec} from '../codec/ClientAuthenticationCustomCodec';
import {
    ClientAuthenticationCodec,
    ClientAuthenticationResponseParams
} from '../codec/ClientAuthenticationCodec';
import {AuthenticationStatus} from '../protocol/AuthenticationStatus';
import {Invocation} from '../invocation/InvocationService';
import {PartitionServiceImpl} from '../PartitionService';

const CONNECTION_REMOVED_EVENT_NAME = 'connectionRemoved';
const CONNECTION_ADDED_EVENT_NAME = 'connectionAdded';

const CLIENT_TYPE = 'NJS';
const SERIALIZATION_VERSION = 1;
const SET_TIMEOUT_MAX_DELAY = 2147483647;
const BINARY_PROTOCOL_VERSION = Buffer.from('CP2');

enum ClientState {
    /**
     * Clients start with this state. Once a client connects to a cluster,
     * it directly switches to {@link INITIALIZED_ON_CLUSTER} instead of
     * {@link CONNECTED_TO_CLUSTER} because on startup a client has no
     * local state to send to the cluster.
     */
    INITIAL = 0,

    /**
     * When a client switches to a new cluster, it moves to this state.
     * It means that the client has connected to a new cluster but not sent
     * its local state to the new cluster yet.
     */
    CONNECTED_TO_CLUSTER = 1,

    /**
     * When a client sends its local state to the cluster it has connected,
     * it switches to this state. When a client loses all connections to
     * the current cluster and connects to a new cluster, its state goes
     * back to {@link CONNECTED_TO_CLUSTER}.
     * <p>
     * Invocations are allowed in this state.
     */
    INITIALIZED_ON_CLUSTER = 2,
}

/**
 * Maintains connections between the client and members of the cluster.
 * @internal
 */
export class ClientConnectionManager extends EventEmitter {

    private connectionIdCounter = 0;
    private alive = false;

    private readonly logger: ILogger;
    private readonly client: HazelcastClient;
    private readonly labels: string[];
    private readonly shuffleMemberList: boolean;
    private readonly asyncStart: boolean;
    private readonly reconnectMode: ReconnectMode;
    private readonly isSmartRoutingEnabled: boolean;
    private connectionTimeoutMillis: number;
    private heartbeatManager: HeartbeatManager;
    private authenticationTimeout: number;
    private clientUuid = UuidUtil.generate(false);
    private waitStrategy: WaitStrategy;
    private loadBalancer: LoadBalancer;
    private activeConnections = new Map<string, ClientConnection>();
    private pendingConnections = new Map<string, DeferredPromise<ClientConnection>>();
    private clusterId: UUID;
    private clientState = ClientState.INITIAL;
    private connectToClusterTaskSubmitted: boolean;
    private reconnectToMembersTask: Task;
    // contains member UUIDs (strings) for members with in-flight connection attempt
    private connectingMembers = new Set<string>();

    constructor(client: HazelcastClient) {
        super();
        this.client = client;
        this.loadBalancer = client.getLoadBalancer();
        this.labels = client.getConfig().clientLabels;
        this.logger = this.client.getLoggingService().getLogger();
        this.connectionTimeoutMillis = this.initConnectionTimeoutMillis();
        this.heartbeatManager = new HeartbeatManager(client, this);
        this.authenticationTimeout = this.heartbeatManager.getHeartbeatTimeout();
        this.shuffleMemberList = client.getConfig().properties['hazelcast.client.shuffle.member.list'] as boolean;
        this.isSmartRoutingEnabled = client.getConfig().network.smartRouting;
        this.waitStrategy = this.initWaitStrategy(client.getConfig() as ClientConfigImpl);
        const connectionStrategyConfig = client.getConfig().connectionStrategy;
        this.asyncStart = connectionStrategyConfig.asyncStart;
        this.reconnectMode = connectionStrategyConfig.reconnectMode;
    }

    start(): Promise<void> {
        if (this.alive) {
            return Promise.resolve();
        }
        this.alive = true;

        this.heartbeatManager.start();
        return this.connectToCluster();
    }

    connectToAllClusterMembers(): Promise<void> {
        if (!this.isSmartRoutingEnabled) {
            return Promise.resolve();
        }

        const members = this.client.getClusterService().getMembers();
        return this.tryConnectToAllClusterMembers(members)
            .then(() => {
                this.reconnectToMembersTask = scheduleWithRepetition(this.reconnectToMembers.bind(this), 1000, 1000);
            });
    }

    shutdown(): void {
        if (!this.alive) {
            return;
        }

        this.alive = false;
        if (this.reconnectToMembersTask !== undefined) {
            cancelRepetitionTask(this.reconnectToMembersTask);
        }
        this.pendingConnections.forEach((pending) => {
            pending.reject(new ClientNotActiveError('Hazelcast client is shutting down'));
        });

        // HeartbeatManager should be shut down before connections are closed
        this.heartbeatManager.shutdown();
        this.activeConnections.forEach((connection) => {
            connection.close('Hazelcast client is shutting down', null);
        });

        this.removeAllListeners(CONNECTION_REMOVED_EVENT_NAME);
        this.removeAllListeners(CONNECTION_ADDED_EVENT_NAME);
    }

    getConnection(uuid: UUID): ClientConnection {
        return this.activeConnections.get(uuid.toString());
    }

    checkIfInvocationAllowed(): Error {
        const state = this.clientState;
        if (state === ClientState.INITIALIZED_ON_CLUSTER && this.activeConnections.size > 0) {
            return null;
        }

        let error: Error;
        if (state === ClientState.INITIAL) {
            if (this.asyncStart) {
                error = new ClientOfflineError();
            } else {
                error = new IOError('No connection found to cluster since the client is starting.');
            }
        } else if (this.reconnectMode === ReconnectMode.ASYNC) {
            error = new ClientOfflineError();
        } else {
            error = new IOError('No connection found to cluster.');
        }
        return error;
    }

    getActiveConnections(): ClientConnection[] {
        return Array.from(this.activeConnections.values());
    }

    isAlive(): boolean {
        return this.alive;
    }

    getClientUuid(): UUID {
        return this.clientUuid;
    }

    getOrConnectToAddress(address: AddressImpl): Promise<ClientConnection> {
        if (!this.client.getLifecycleService().isRunning()) {
            return Promise.reject(new ClientNotActiveError('Client is not active.'));
        }

        const connection = this.getConnectionForAddress(address);
        if (connection) {
            return Promise.resolve(connection);
        }

        return this.getOrConnect(address, () => this.translateAddress(address));
    }

    getOrConnectToMember(member: MemberImpl): Promise<ClientConnection> {
        if (!this.client.getLifecycleService().isRunning()) {
            return Promise.reject(new ClientNotActiveError('Client is not active.'));
        }

        const connection = this.getConnection(member.uuid);
        if (connection) {
            return Promise.resolve(connection);
        }

        return this.getOrConnect(member.address, () => this.translateMemberAddress(member));
    }

    private getOrConnect(address: AddressImpl,
                         translateAddressFn: () => Promise<AddressImpl>): Promise<ClientConnection> {
        const addressKey = address.toString();
        const pendingConnection = this.pendingConnections.get(addressKey);
        if (pendingConnection) {
            return pendingConnection.promise;
        }

        const connectionResolver: DeferredPromise<ClientConnection> = deferredPromise<ClientConnection>();
        this.pendingConnections.set(addressKey, connectionResolver);

        const processResponseCallback = (msg: ClientMessage): void => {
            this.client.getInvocationService().processResponse(msg);
        };

        let translatedAddress: AddressImpl;
        let clientConnection: ClientConnection;
        translateAddressFn()
            .then((translated) => {
                translatedAddress = translated;
                if (translatedAddress == null) {
                    throw new RangeError(`Address translator could not translate address ${address}`);
                }
                return this.triggerConnect(translatedAddress);
            })
            .then((socket) => {
                clientConnection = new ClientConnection(
                    this.client, translatedAddress, socket, this.connectionIdCounter++);
                // close the connection proactively on errors
                socket.once('error', (err: NodeJS.ErrnoException) => {
                    clientConnection.close('Socket error. Connection might be closed by other side', err);
                });
                return this.initiateCommunication(socket);
            })
            .then(() => clientConnection.registerResponseCallback(processResponseCallback))
            .then(() => this.authenticateOnCluster(clientConnection))
            .then((conn) => connectionResolver.resolve(conn))
            .catch((error) => connectionResolver.reject(error));

        return timedPromise(
            connectionResolver.promise,
            this.connectionTimeoutMillis,
            new HazelcastError(`Connection timed out to address ${address}.`)
        ).finally(() => this.pendingConnections.delete(addressKey));
    }

    getRandomConnection(): ClientConnection {
        if (this.isSmartRoutingEnabled) {
            const member = this.loadBalancer.next();
            if (member != null) {
                const connection = this.getConnection(member.uuid);
                if (connection != null) {
                    return connection;
                }
            }
        }

        const iterator = this.activeConnections.values();
        const next = iterator.next();
        if (!next.done) {
            return next.value;
        } else {
            return null;
        }
    }

    onConnectionClose(connection: ClientConnection): void {
        const endpoint = connection.getRemoteAddress();
        const memberUuid = connection.getRemoteUuid();

        if (endpoint == null) {
            this.logger.trace('ConnectionManager', 'Destroying ' + connection
                + ', but it has endpoint set to null -> not removing it from a connection map');
            return;
        }

        // do the clean up only if connection is active
        const activeConnection = memberUuid != null ? this.activeConnections.get(memberUuid.toString()) : null;
        if (connection === activeConnection) {
            this.activeConnections.delete(memberUuid.toString());
            this.logger.info('ConnectionManager', 'Removed connection to endpoint: '
                + endpoint + ':' + memberUuid + ', connection: ' + connection);
            if (this.activeConnections.size === 0) {
                if (this.clientState === ClientState.INITIALIZED_ON_CLUSTER) {
                    this.emitLifecycleEvent(LifecycleState.DISCONNECTED);
                }
                this.triggerClusterReconnection();
            }
            this.emitConnectionRemovedEvent(connection);
        } else {
            this.logger.trace('ConnectionManager', 'Destroying a connection, but there is no mapping '
                + endpoint + ':' + memberUuid + '->' + connection + ' in the connection map.)');
        }
    }

    private initWaitStrategy(config: ClientConfigImpl): WaitStrategy {
        const connectionStrategyConfig = config.connectionStrategy;
        const retryConfig = connectionStrategyConfig.connectionRetry;
        return new WaitStrategy(retryConfig.initialBackoffMillis, retryConfig.maxBackoffMillis,
            retryConfig.multiplier, retryConfig.clusterConnectTimeoutMillis, retryConfig.jitter, this.logger);
    }

    private initConnectionTimeoutMillis(): number {
        const networkConfig = this.client.getConfig().network;
        const connTimeout = networkConfig.connectionTimeout;
        return connTimeout === 0 ? SET_TIMEOUT_MAX_DELAY : connTimeout;
    }

    private connectToCluster(): Promise<void> {
        if (this.asyncStart) {
            this.submitConnectToClusterTask();
            return Promise.resolve();
        } else {
            return this.doConnectToCluster();
        }
    }

    private submitConnectToClusterTask(): void {
        if (this.connectToClusterTaskSubmitted) {
            return;
        }

        this.doConnectToCluster()
            .then(() => {
                this.connectToClusterTaskSubmitted = false;
                if (this.activeConnections.size === 0) {
                    this.logger.warn('ConnectionManager', 'No connection to cluster ' + this.clusterId);
                    this.submitConnectToClusterTask();
                }
            })
            .catch((error: Error) => {
                this.logger.warn('ConnectionManager', 'Could not connect to any cluster, shutting down '
                    + 'the client: ' + error.message);
                this.shutdownClient();
            });

        this.connectToClusterTaskSubmitted = true;
    }

    private doConnectToCluster(): Promise<void> {
        const triedAddresses = new Set<string>();
        this.waitStrategy.reset();
        return this.tryConnectingToAddresses(triedAddresses)
            .then((isConnected) => {
                if (isConnected) {
                    return;
                }
                this.logger.info('ConnectionManager', 'Unable to connect any address from the cluster '
                    + 'with the name: ' + this.client.getConfig().clusterName
                    + '. The following addresses were tried: ' + Array.from(triedAddresses));

                const message = this.client.getLifecycleService().isRunning()
                    ? 'Unable to connect any cluster.' : 'Client is being shutdown.';
                throw new IllegalStateError(message);
            });
    }

    private tryConnectingToAddresses(triedAddresses: Set<string>): Promise<boolean> {
        return this.getPossibleMemberAddresses()
            .then((addresses) => {
                return this.tryConnectingToAddress(0, addresses, triedAddresses);
            })
            .then((isConnected) => {
                if (isConnected) {
                    return true;
                }
                // If the address providers load no addresses (which seems to be possible),
                // then the above loop is not entered and the lifecycle check is missing,
                // hence we need to repeat the same check at this point.
                if (!this.client.getLifecycleService().isRunning()) {
                    return Promise.reject(new ClientNotActiveError('Client is not active.'));
                }
                return this.waitStrategy.sleep()
                    .then((notTimedOut) => {
                        if (notTimedOut) {
                            return this.tryConnectingToAddresses(triedAddresses);
                        }
                        return false;
                    });
            })
            .catch((error: Error) => {
                if (error instanceof ClientNotAllowedInClusterError
                        || error instanceof InvalidConfigurationError) {
                    this.logger.warn('ConnectionManager', 'Stopped trying on the cluster: '
                        + this.client.getConfig().clusterName + ' reason: ' + error.message);
                    return false;
                }
                throw error;
            });
    }

    private tryConnectingToAddress(index: number,
                                   addresses: AddressImpl[],
                                   triedAddresses: Set<string>): Promise<boolean> {
        if (index >= addresses.length) {
            return Promise.resolve(false);
        }
        const address = addresses[index];
        if (!this.client.getLifecycleService().isRunning()) {
            return Promise.reject(new ClientNotActiveError('Client is not active.'));
        }
        triedAddresses.add(address.toString());
        return this.connect(address)
            .then((connection) => {
                if (connection != null) {
                    return true;
                }
                return this.tryConnectingToAddress(index + 1, addresses, triedAddresses);
            });
    }

    private connect(address: AddressImpl): Promise<ClientConnection> {
        this.logger.info('ConnectionManager', 'Trying to connect to ' + address);
        return this.getOrConnectToAddress(address)
            .catch((error) => {
                this.logger.warn('ConnectionManager', 'Error during initial connection to '
                    + address + ' ' + error);
                return null;
            });
    }

    private emitLifecycleEvent(state: LifecycleState): void {
        (this.client.getLifecycleService() as LifecycleServiceImpl).emitLifecycleEvent(state);
    }

    private getPossibleMemberAddresses(): Promise<AddressImpl[]> {
        const addresses = this.client.getClusterService().getMembers()
            .map(((member) => member.address.toString()));

        if (this.shuffleMemberList) {
            shuffleArray(addresses);
        }

        const addressProvider = this.client.getAddressProvider();

        return addressProvider.loadAddresses()
            .catch((error: Error) => {
                this.logger.warn('ConnectionManager', 'Error from AddressProvider '
                    + addressProvider + ', error: ' + error.message);
                return new Array<string>();
            })
            .then((providerAddresses) => {
                if (this.shuffleMemberList) {
                    shuffleArray(providerAddresses);
                }
                const allAddresses = Array.from(new Set([...addresses, ...providerAddresses]));
                const result: AddressImpl[] = [];
                for (const address of allAddresses) {
                    result.push(...AddressHelper.getSocketAddresses(address));
                }
                return result;
            });
    }

    private getConnectionForAddress(address: AddressImpl): ClientConnection {
        for (const connection of this.getActiveConnections()) {
            if (connection.getRemoteAddress().equals(address)) {
                return connection;
            }
        }
        return null;
    }

    private initiateCommunication(socket: net.Socket): Promise<void> {
        // Send the protocol version
        const deferred = deferredPromise<void>();
        socket.write(BINARY_PROTOCOL_VERSION as any, (err: Error) => {
            if (err) {
                deferred.reject(err);
            }
            deferred.resolve();
        });

        return deferred.promise;
    }

    private triggerConnect(translatedAddress: AddressImpl): Promise<net.Socket> {
        if (this.client.getConfig().network.ssl.enabled) {
            if (this.client.getConfig().network.ssl.sslOptions) {
                const opts = this.client.getConfig().network.ssl.sslOptions;
                return this.connectTLSSocket(translatedAddress, opts);
            } else if (this.client.getConfig().network.ssl.sslOptionsFactory
                       || this.client.getConfig().network.ssl.sslOptionsFactoryProperties) {
                const factoryProperties = this.client.getConfig().network.ssl.sslOptionsFactoryProperties;
                let factory = this.client.getConfig().network.ssl.sslOptionsFactory;
                if (factory == null) {
                    factory = new BasicSSLOptionsFactory();
                }
                return factory.init(factoryProperties).then(() => {
                    return this.connectTLSSocket(translatedAddress, factory.getSSLOptions());
                });
            } else {
                // the default behavior when ssl is enabled
                const opts = this.client.getConfig().network.ssl.sslOptions = {
                    checkServerIdentity: (): any => null,
                    rejectUnauthorized: true,
                };
                return this.connectTLSSocket(translatedAddress, opts);
            }
        } else {
            return this.connectNetSocket(translatedAddress);
        }
    }

    private connectTLSSocket(address: AddressImpl, configOpts: any): Promise<tls.TLSSocket> {
        const connectionResolver = deferredPromise<tls.TLSSocket>();
        const socket = tls.connect(address.port, address.host, configOpts);
        socket.once('secureConnect', () => {
            connectionResolver.resolve(socket);
        });
        socket.once('error', connectionResolver.reject);
        return connectionResolver.promise;
    }

    private connectNetSocket(address: AddressImpl): Promise<net.Socket> {
        const connectionResolver = deferredPromise<net.Socket>();
        const socket = net.connect(address.port, address.host);
        socket.once('connect', () => {
            connectionResolver.resolve(socket);
        });
        socket.once('error', connectionResolver.reject);
        return connectionResolver.promise;
    }

    private emitConnectionAddedEvent(connection: ClientConnection): void {
        this.emit(CONNECTION_ADDED_EVENT_NAME, connection);
    }

    private emitConnectionRemovedEvent(connection: ClientConnection): void {
        this.emit(CONNECTION_REMOVED_EVENT_NAME, connection);
    }

    private translateAddress(target: AddressImpl): Promise<AddressImpl> {
        const addressProvider = this.client.getAddressProvider();
        return addressProvider.translate(target)
            .catch((error: Error) => {
                this.logger.warn('ConnectionManager', 'Failed to translate address '
                    + target + ' via address provider ' + error.message);
                return Promise.reject(error);
            });
    }

    private translateMemberAddress(member: MemberImpl): Promise<AddressImpl> {
        if (member.addressMap == null) {
            return this.translateAddress(member.address);
        }
        if (this.client.getClusterService().translateToPublicAddress()) {
            const publicAddress = lookupPublicAddress(member);
            if (publicAddress != null) {
                return Promise.resolve(publicAddress);
            }
            return Promise.resolve(member.address);
        }
        return this.translateAddress(member.address);
    }

    private triggerClusterReconnection(): void {
        if (this.reconnectMode === ReconnectMode.OFF) {
            this.logger.info('ConnectionManager', 'RECONNECT MODE is off. Shutting down the client.');
            this.shutdownClient();
            return;
        }

        if (this.client.getLifecycleService().isRunning()) {
            this.submitConnectToClusterTask();
        }
    }

    private shutdownClient(): void {
        (this.client.getLifecycleService() as LifecycleServiceImpl).shutdown()
            .catch((e) => {
                this.logger.error('ConnectionManager', 'Failed to shut down client.', e);
            });
    }

    // This method makes sure that the smart client has connection to all cluster members.
    // This is called periodically.
    private reconnectToMembers(): void {
        if (!this.client.getLifecycleService().isRunning()) {
            return;
        }

        for (const member of this.client.getClusterService().getMembers()) {
            if (this.getConnection(member.uuid) != null) {
                continue;
            }
            const memberUuid = member.uuid.toString();
            if (this.connectingMembers.has(memberUuid)) {
                continue;
            }
            this.connectingMembers.add(memberUuid);
            this.getOrConnectToMember(member)
                .catch(() => {
                    // no-op
                })
                .finally(() => {
                    this.connectingMembers.delete(memberUuid);
                });
        }
    }

    private authenticateOnCluster(connection: ClientConnection): Promise<ClientConnection> {
        const request = this.encodeAuthenticationRequest();
        const invocation = new Invocation(this.client, request);
        invocation.connection = connection;
        return timedPromise(
            this.client.getInvocationService().invokeUrgent(invocation),
            this.authenticationTimeout
        ).catch((e) => {
            connection.close('Failed to authenticate connection', e);
            throw e;
        }).then((responseMessage) => {
            const response = ClientAuthenticationCodec.decodeResponse(responseMessage);
            if (response.status === AuthenticationStatus.AUTHENTICATED) {
                return this.onAuthenticated(connection, response);
            } else {
                let error: Error;
                switch (response.status) {
                    case AuthenticationStatus.CREDENTIALS_FAILED:
                        error = new AuthenticationError('Authentication failed. The configured cluster name on '
                            + 'the client does not match the one configured in the cluster or '
                            + 'the credentials set in the client security config could not be authenticated');
                        break;
                    case AuthenticationStatus.SERIALIZATION_VERSION_MISMATCH:
                        error = new IllegalStateError('Server serialization version does not match to client.');
                        break;
                    case AuthenticationStatus.NOT_ALLOWED_IN_CLUSTER:
                        error = new ClientNotAllowedInClusterError('Client is not allowed in the cluster');
                        break;
                    default:
                        error = new AuthenticationError('Authentication status code not supported. Status: '
                            + response.status);
                }
                connection.close('Failed to authenticate connection', error);
                throw error;
            }
        });
    }

    private onAuthenticated(connection: ClientConnection,
                            response: ClientAuthenticationResponseParams): ClientConnection {
        this.checkPartitionCount(response.partitionCount);
        connection.setConnectedServerVersion(response.serverHazelcastVersion);
        connection.setRemoteAddress(response.address);
        connection.setRemoteUuid(response.memberUuid);

        const existingConnection = this.getConnection(response.memberUuid);
        if (existingConnection != null) {
            connection.close('Duplicate connection to same member with uuid: '
                + response.memberUuid.toString(), null);
            return existingConnection;
        }

        const newClusterId = response.clusterId;

        const initialConnection = this.activeConnections.size === 0;
        const changedCluster = initialConnection && this.clusterId != null && !newClusterId.equals(this.clusterId);
        if (changedCluster) {
            this.logger.warn('ConnectionManager', 'Switching from current cluster: '
                + this.clusterId + ' to new cluster: ' + newClusterId);
            this.client.onClusterRestart();
        }

        this.activeConnections.set(response.memberUuid.toString(), connection);
        if (initialConnection) {
            this.clusterId = newClusterId;
            if (changedCluster) {
                this.clientState = ClientState.CONNECTED_TO_CLUSTER;
                this.initializeClientOnCluster(newClusterId);
            } else {
                this.clientState = ClientState.INITIALIZED_ON_CLUSTER;
                this.emitLifecycleEvent(LifecycleState.CONNECTED);
            }
        }

        this.logger.info('ConnectionManager', 'Authenticated with server '
            + response.address + ':' + response.memberUuid + ', server version: '
            + response.serverHazelcastVersion + ', local address: ' + connection.getLocalAddress());
        this.emitConnectionAddedEvent(connection);

        // It could happen that this connection is already closed and
        // onConnectionClose() is called even before the block
        // above is executed. In this case, now we have a closed but registered
        // connection. We do a final check here to remove this connection
        // if needed.
        if (!connection.isAlive()) {
            this.onConnectionClose(connection);
        }
        return connection;
    }

    private encodeAuthenticationRequest(): ClientMessage {
        const clusterName = this.client.getConfig().clusterName;
        const clientVersion = BuildInfo.getClientVersion();
        const customCredentials = this.client.getConfig().customCredentials;
        const clientName = this.client.getName();

        let clientMessage: ClientMessage;
        if (customCredentials != null) {
            const credentialsPayload = this.client.getSerializationService().toData(customCredentials).toBuffer();

            clientMessage = ClientAuthenticationCustomCodec.encodeRequest(clusterName, credentialsPayload, this.clientUuid,
                CLIENT_TYPE, SERIALIZATION_VERSION, clientVersion, clientName, this.labels);
        } else {
            clientMessage = ClientAuthenticationCodec.encodeRequest(clusterName, null, null, this.clientUuid,
                CLIENT_TYPE, SERIALIZATION_VERSION, clientVersion, clientName, this.labels);
        }

        return clientMessage;
    }

    private checkPartitionCount(newPartitionCount: number): void {
        const partitionService = this.client.getPartitionService() as PartitionServiceImpl;
        if (!partitionService.checkAndSetPartitionCount(newPartitionCount)) {
            throw new ClientNotAllowedInClusterError('Client can not work with this cluster because it has a different '
                + 'partition count. Expected partition count: ' + partitionService.getPartitionCount()
                + ', member partition count: ' + newPartitionCount);
        }
    }

    private initializeClientOnCluster(targetClusterId: UUID): void {
        if (!targetClusterId.equals(this.clusterId)) {
            this.logger.warn('ConnectionManager', 'Will not send client state to cluster: '
                + targetClusterId + ', switched to a new cluster: ' + this.clusterId);
            return;
        }

        this.client.sendStateToCluster()
            .then(() => {
                if (targetClusterId.equals(this.clusterId)) {
                    this.logger.trace('ConnectionManager', 'Client state is sent to cluster: '
                        + targetClusterId);

                    this.clientState = ClientState.INITIALIZED_ON_CLUSTER;
                    this.emitLifecycleEvent(LifecycleState.CONNECTED);
                } else {
                    this.logger.warn('ConnectionManager', 'Cannot set client state to initialized on '
                        + 'cluster because current cluster id: ' + this.clusterId
                        + ' is different than expected cluster id: ' + targetClusterId);
                }
            })
            .catch((error: Error) => {
                const clusterName = this.client.getConfig().clusterName;
                this.logger.warn('ConnectionManager', 'Failure during sending state to the cluster: '
                    + error.message);
                if (targetClusterId.equals(this.clusterId)) {
                    this.logger.warn('ConnectionManager', 'Retrying sending state to the cluster: '
                        + targetClusterId + ', name: ' + clusterName);
                    this.initializeClientOnCluster(targetClusterId);
                }
            });
    }

    private tryConnectToAllClusterMembers(members: MemberImpl[]): Promise<void> {
        const promises: Array<Promise<void | ClientConnection>> = [];
        for (const member of members) {
            promises.push(this.getOrConnectToMember(member)
                .catch(() => {
                    // no-op
                }));
        }
        return Promise.all(promises)
            .then(() => undefined);
    }
}
