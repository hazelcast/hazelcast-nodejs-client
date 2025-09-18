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
exports.ConnectionManager = exports.ClientState = exports.CLIENT_TYPE = exports.CONNECTION_ADDED_EVENT_NAME = exports.CONNECTION_REMOVED_EVENT_NAME = void 0;
const events_1 = require("events");
const core_1 = require("../core");
const MemberInfo_1 = require("../core/MemberInfo");
const Connection_1 = require("./Connection");
const net = require("net");
const tls = require("tls");
const Util_1 = require("../util/Util");
const BasicSSLOptionsFactory_1 = require("../connection/BasicSSLOptionsFactory");
const HeartbeatManager_1 = require("./HeartbeatManager");
const UuidUtil_1 = require("../util/UuidUtil");
const WaitStrategy_1 = require("./WaitStrategy");
const ConnectionStrategyConfig_1 = require("../config/ConnectionStrategyConfig");
const LifecycleService_1 = require("../LifecycleService");
const BuildInfo_1 = require("../BuildInfo");
const ClientAuthenticationCustomCodec_1 = require("../codec/ClientAuthenticationCustomCodec");
const ClientAuthenticationCodec_1 = require("../codec/ClientAuthenticationCodec");
const AuthenticationStatus_1 = require("../protocol/AuthenticationStatus");
const InvocationService_1 = require("../invocation/InvocationService");
/** @internal */
exports.CONNECTION_REMOVED_EVENT_NAME = 'connectionRemoved';
/** @internal */
exports.CONNECTION_ADDED_EVENT_NAME = 'connectionAdded';
/** @internal */
exports.CLIENT_TYPE = 'NJS';
const SERIALIZATION_VERSION = 1;
const SET_TIMEOUT_MAX_DELAY = 2147483647;
const BINARY_PROTOCOL_VERSION = Buffer.from('CP2');
/** @internal */
var ClientState;
(function (ClientState) {
    /**
     * Clients start with this state. Once a client connects to a cluster,
     * it directly switches to {@link INITIALIZED_ON_CLUSTER} instead of
     * {@link CONNECTED_TO_CLUSTER} because on startup a client has no
     * local state to send to the cluster.
     */
    ClientState[ClientState["INITIAL"] = 0] = "INITIAL";
    /**
     * When a client switches to a new cluster, it moves to this state.
     * It means that the client has connected to a new cluster but not sent
     * its local state to the new cluster yet.
     */
    ClientState[ClientState["CONNECTED_TO_CLUSTER"] = 1] = "CONNECTED_TO_CLUSTER";
    /**
     * When a client sends its local state to the cluster it has connected,
     * it switches to this state. When a client loses all connections to
     * the current cluster and connects to a new cluster, its state goes
     * back to {@link CONNECTED_TO_CLUSTER}.
     *
     * Invocations are allowed in this state.
     */
    ClientState[ClientState["INITIALIZED_ON_CLUSTER"] = 2] = "INITIALIZED_ON_CLUSTER";
    /**
     * When the client closes the last connection to the cluster it
     * currently connected to, it switches to this state.
     *
     * In this state, reconnectToMembersTask is not allowed to
     * attempt connecting to last known member list.
     */
    ClientState[ClientState["DISCONNECTED_FROM_CLUSTER"] = 3] = "DISCONNECTED_FROM_CLUSTER";
})(ClientState = exports.ClientState || (exports.ClientState = {}));
/**
 * Maintains connections between the client and the members.
 * @internal
 */
class ConnectionManager extends events_1.EventEmitter {
    constructor(client, clientName, clientConfig, logger, partitionService, serializationService, lifecycleService, clusterFailoverService, failoverConfigProvided, clusterService, invocationService, connectionRegistry) {
        super();
        this.client = client;
        this.clientName = clientName;
        this.clientConfig = clientConfig;
        this.logger = logger;
        this.partitionService = partitionService;
        this.serializationService = serializationService;
        this.lifecycleService = lifecycleService;
        this.clusterFailoverService = clusterFailoverService;
        this.failoverConfigProvided = failoverConfigProvided;
        this.clusterService = clusterService;
        this.invocationService = invocationService;
        this.connectionRegistry = connectionRegistry;
        this.active = false;
        this.connectionIdCounter = 0;
        this.switchingToNextCluster = false;
        this.clientUuid = UuidUtil_1.UuidUtil.generate(false);
        this.pendingConnections = new Map();
        // contains member UUIDs (strings) for members with in-flight connection attempt
        this.connectingMembers = new Set();
        this.labels = this.clientConfig.clientLabels;
        this.connectionTimeoutMillis = this.initConnectionTimeoutMillis();
        this.heartbeatManager = new HeartbeatManager_1.HeartbeatManager(this.clientConfig.properties, this.logger, this);
        this.authenticationTimeout = this.heartbeatManager.getHeartbeatTimeout();
        this.shuffleMemberList = this.clientConfig.properties['hazelcast.client.shuffle.member.list'];
        this.smartRoutingEnabled = this.clientConfig.network.smartRouting;
        this.waitStrategy = this.initWaitStrategy(this.clientConfig);
        const connectionStrategyConfig = this.clientConfig.connectionStrategy;
        this.asyncStart = connectionStrategyConfig.asyncStart;
        this.reconnectMode = connectionStrategyConfig.reconnectMode;
        this.totalBytesWritten = 0;
        this.totalBytesRead = 0;
        this.clusterService.addMembershipListener(this);
    }
    isActive() {
        return this.active;
    }
    getConnectionRegistry() {
        return this.connectionRegistry;
    }
    start() {
        if (this.active) {
            return Promise.resolve();
        }
        this.active = true;
        this.heartbeatManager.start(this.invocationService);
        return this.connectToCluster();
    }
    connectToAllClusterMembers() {
        if (!this.smartRoutingEnabled) {
            return Promise.resolve();
        }
        const members = this.clusterService.getMembers();
        return this.tryConnectToAllClusterMembers(members)
            .then(() => {
            this.reconnectToMembersTask = (0, Util_1.scheduleWithRepetition)(this.reconnectToMembers.bind(this), 1000, 1000);
        });
    }
    shutdown() {
        if (!this.active) {
            return;
        }
        this.active = false;
        if (this.reconnectToMembersTask !== undefined) {
            (0, Util_1.cancelRepetitionTask)(this.reconnectToMembersTask);
        }
        this.pendingConnections.forEach((pending) => {
            pending.reject(new core_1.ClientNotActiveError('Hazelcast client is shutting down'));
        });
        // HeartbeatManager should be shut down before connections are closed
        this.heartbeatManager.shutdown();
        this.connectionRegistry.forEachConnection((conn) => {
            conn.close('Hazelcast client is shutting down', null);
        });
        this.removeAllListeners(exports.CONNECTION_REMOVED_EVENT_NAME);
        this.removeAllListeners(exports.CONNECTION_ADDED_EVENT_NAME);
    }
    reset() {
        this.connectionRegistry.forEachConnection((conn) => {
            conn.close(null, new core_1.TargetDisconnectedError('Hazelcast client is switching cluster'));
        });
    }
    getClientUuid() {
        return this.clientUuid;
    }
    getOrConnectToAddress(address) {
        if (!this.lifecycleService.isRunning()) {
            return Promise.reject(new core_1.ClientNotActiveError('Client is not active.'));
        }
        const connection = this.getConnectionForAddress(address);
        if (connection) {
            return Promise.resolve(connection);
        }
        return this.getOrConnect(address, () => this.translateAddress(address));
    }
    getOrConnectToMember(member) {
        if (!this.lifecycleService.isRunning()) {
            return Promise.reject(new core_1.ClientNotActiveError('Client is not active.'));
        }
        const connection = this.connectionRegistry.getConnection(member.uuid);
        if (connection) {
            return Promise.resolve(connection);
        }
        return this.getOrConnect(member.address, () => this.translateMemberAddress(member));
    }
    getOrConnect(address, translateAddressFn) {
        const addressKey = address.toString();
        const pendingConnection = this.pendingConnections.get(addressKey);
        if (pendingConnection) {
            return pendingConnection.promise;
        }
        const connectionResolver = (0, Util_1.deferredPromise)();
        this.pendingConnections.set(addressKey, connectionResolver);
        const processResponseCallback = (msg) => {
            this.invocationService.processResponse(msg);
        };
        let translatedAddress;
        let connection;
        translateAddressFn()
            .then((translated) => {
            translatedAddress = translated;
            if (translatedAddress == null) {
                throw new RangeError(`Address translator could not translate address ${address}`);
            }
            return this.triggerConnect(translatedAddress);
        })
            .then((socket) => {
            connection = new Connection_1.Connection(this, this.clientConfig, this.logger, translatedAddress, socket, this.connectionIdCounter++, this.lifecycleService, numberOfBytes => { this.totalBytesRead += numberOfBytes; }, numberOfBytes => { this.totalBytesWritten += numberOfBytes; });
            // close the connection proactively on errors
            socket.once('error', (err) => {
                connection.close('Socket error.', err);
            });
            // close the connection if socket is not readable anymore
            socket.once('end', () => {
                const reason = 'Connection closed by the other side.';
                connection.close(reason, new core_1.IOError(reason));
            });
            return this.initiateCommunication(socket);
        })
            .then(() => connection.registerResponseCallback(processResponseCallback))
            .then(() => this.authenticateOnCluster(connection))
            .then((conn) => connectionResolver.resolve(conn))
            .catch((err) => {
            // make sure to close connection on errors
            if (connection != null) {
                connection.close(null, err);
            }
            connectionResolver.reject(err);
        });
        return connectionResolver.promise
            .finally(() => this.pendingConnections.delete(addressKey));
    }
    onConnectionClose(connection) {
        const endpoint = connection.getRemoteAddress();
        const memberUuid = connection.getRemoteUuid();
        if (endpoint == null) {
            this.logger.trace('ConnectionManager', 'Destroying ' + connection
                + ', but it has endpoint set to null -> not removing it from a connection map');
            return;
        }
        // do the cleanup only if connection is active
        const activeConnection = memberUuid != null ? this.connectionRegistry.getConnection(memberUuid) : null;
        if (connection === activeConnection) {
            this.connectionRegistry.deleteConnection(memberUuid);
            this.logger.info('ConnectionManager', 'Removed connection to endpoint: '
                + endpoint + ':' + memberUuid + ', connection: ' + connection);
            if (this.connectionRegistry.isEmpty()) {
                if (this.connectionRegistry.getClientState() === ClientState.INITIALIZED_ON_CLUSTER) {
                    this.emitLifecycleEvent(LifecycleService_1.LifecycleState.DISCONNECTED);
                }
                this.connectionRegistry.setClientState(ClientState.DISCONNECTED_FROM_CLUSTER);
                this.triggerClusterReconnection();
            }
            this.emitConnectionRemovedEvent(connection);
        }
        else {
            this.logger.trace('ConnectionManager', 'Destroying a connection, but there is no mapping '
                + endpoint + ':' + memberUuid + '->' + connection + ' in the connection map.)');
        }
    }
    initWaitStrategy(config) {
        const connectionStrategyConfig = config.connectionStrategy;
        const retryConfig = connectionStrategyConfig.connectionRetry;
        return new WaitStrategy_1.WaitStrategy(retryConfig.initialBackoffMillis, retryConfig.maxBackoffMillis, retryConfig.multiplier, retryConfig.clusterConnectTimeoutMillis, retryConfig.jitter, this.logger);
    }
    initConnectionTimeoutMillis() {
        const networkConfig = this.clientConfig.network;
        const connTimeout = networkConfig.connectionTimeout;
        return connTimeout === 0 ? SET_TIMEOUT_MAX_DELAY : connTimeout;
    }
    connectToCluster() {
        if (this.asyncStart) {
            this.submitConnectToClusterTask();
            return Promise.resolve();
        }
        else {
            return this.doConnectToCluster();
        }
    }
    submitConnectToClusterTask() {
        if (this.connectToClusterTaskSubmitted) {
            return;
        }
        this.doConnectToCluster()
            .then(() => {
            this.connectToClusterTaskSubmitted = false;
            if (this.connectionRegistry.isEmpty()) {
                this.logger.warn('ConnectionManager', 'No connection to cluster ' + this.clusterId);
                this.submitConnectToClusterTask();
            }
        })
            .catch((error) => {
            this.logger.warn('ConnectionManager', 'Could not connect to any cluster, shutting down '
                + 'the client: ' + error.message);
            this.shutdownClient();
        });
        this.connectToClusterTaskSubmitted = true;
    }
    doConnectToCluster() {
        const ctx = this.clusterFailoverService.current();
        return this.doConnectToCandidateCluster(ctx)
            .then((connected) => {
            if (connected) {
                return true;
            }
            return this.clusterFailoverService.tryNextCluster(this.cleanupAndTryNextCluster.bind(this));
        })
            .then((connected) => {
            if (connected) {
                return;
            }
            const message = this.lifecycleService.isRunning()
                ? 'Unable to connect to any cluster.' : 'Client is being shutdown.';
            throw new core_1.IllegalStateError(message);
        });
    }
    cleanupAndTryNextCluster(nextCtx) {
        this.client.onTryToConnectNextCluster();
        this.logger.info('ConnectionManager', 'Trying to connect to next cluster: '
            + nextCtx.clusterName);
        this.switchingToNextCluster = true;
        return this.doConnectToCandidateCluster(nextCtx)
            .then((connected) => {
            if (connected) {
                return this.clusterService.waitForInitialMemberList()
                    .then(() => {
                    this.emitLifecycleEvent(LifecycleService_1.LifecycleState.CHANGED_CLUSTER);
                    return true;
                });
            }
            return false;
        });
    }
    doConnectToCandidateCluster(ctx) {
        const triedAddresses = new Set();
        this.waitStrategy.reset();
        return this.tryConnectingToAddresses(ctx, triedAddresses);
    }
    tryConnectingToAddresses(ctx, triedAddresses) {
        const triedAddressesPerAttempt = new Set();
        const members = this.clusterService.getMembers();
        if (this.shuffleMemberList) {
            (0, Util_1.shuffleArray)(members);
        }
        // try to connect to a member in the member list first
        return this.tryConnecting(0, members, triedAddressesPerAttempt, (m) => m.address, (m) => this.getOrConnectToMember(m))
            .then((connected) => {
            if (connected) {
                return true;
            }
            // try to connect to a member given via config (explicit config/discovery mechanism)
            return this.loadAddressesFromProvider(ctx.addressProvider)
                .then((addresses) => {
                // filter out already tried addresses
                addresses = addresses.filter((addr) => !triedAddressesPerAttempt.has(addr.toString()));
                return this.tryConnecting(0, addresses, triedAddressesPerAttempt, (a) => a, (a) => this.getOrConnectToAddress(a));
            });
        })
            .then((connected) => {
            if (connected) {
                return true;
            }
            for (const address of triedAddressesPerAttempt.values()) {
                triedAddresses.add(address);
            }
            // If address provider loads no addresses, then the above loop is not entered
            // and the lifecycle check is missing, hence we need to repeat the same check at this point
            if (!this.lifecycleService.isRunning()) {
                return Promise.reject(new core_1.ClientNotActiveError('Client is not active.'));
            }
            return this.waitStrategy.sleep()
                .then((notTimedOut) => {
                if (notTimedOut) {
                    return this.tryConnectingToAddresses(ctx, triedAddresses);
                }
                this.logger.info('ConnectionManager', 'Unable to connect to any address '
                    + 'from the cluster with name: ' + ctx.clusterName
                    + '. The following addresses were tried: ' + Array.from(triedAddresses).join(', '));
                return false;
            });
        })
            .catch((err) => {
            if (err instanceof core_1.ClientNotAllowedInClusterError
                || err instanceof core_1.InvalidConfigurationError) {
                this.logger.warn('ConnectionManager', 'Stopped trying on the cluster: '
                    + ctx.clusterName + ' reason: ' + err.message);
                return false;
            }
            throw err;
        });
    }
    tryConnecting(index, items, triedAddresses, getAddressFn, connectToFn) {
        if (index >= items.length) {
            return Promise.resolve(false);
        }
        if (!this.lifecycleService.isRunning()) {
            return Promise.reject(new core_1.ClientNotActiveError('Client is not active.'));
        }
        const item = items[index];
        const address = getAddressFn(item);
        triedAddresses.add(address.toString());
        return this.connect(item, () => connectToFn(item))
            .then((connection) => {
            if (connection != null) {
                return true;
            }
            return this.tryConnecting(index + 1, items, triedAddresses, getAddressFn, connectToFn);
        });
    }
    connect(target, getOrConnectFn) {
        this.logger.info('ConnectionManager', 'Trying to connect to ' + target.toString());
        return getOrConnectFn()
            .catch((err) => {
            this.logger.warn('ConnectionManager', 'Error during initial connection to '
                + target.toString() + ' ' + err);
            if (err instanceof core_1.InvalidConfigurationError
                || err instanceof core_1.ClientNotAllowedInClusterError) {
                throw err;
            }
            return null;
        });
    }
    emitLifecycleEvent(state) {
        this.lifecycleService.emitLifecycleEvent(state);
    }
    loadAddressesFromProvider(addressProvider) {
        return addressProvider.loadAddresses()
            .catch((error) => {
            this.logger.warn('ConnectionManager', 'Failed to load addresses from '
                + addressProvider + ' address provider, error: ' + error.message);
            return new core_1.Addresses();
        })
            .then((providerAddresses) => {
            if (this.shuffleMemberList) {
                // The relative order between primary and secondary addresses should not
                // be changed. So we shuffle the lists separately and then add them to
                // the final list so that secondary addresses are not tried before all
                // primary addresses have been tried. Otherwise, we can get startup delays.
                (0, Util_1.shuffleArray)(providerAddresses.primary);
                (0, Util_1.shuffleArray)(providerAddresses.secondary);
            }
            const result = [];
            providerAddresses.primary.forEach((addr) => result.push(addr));
            providerAddresses.secondary.forEach((addr) => result.push(addr));
            return result;
        });
    }
    getConnectionForAddress(address) {
        for (const connection of this.connectionRegistry.getConnections()) {
            if (connection.getRemoteAddress().equals(address)) {
                return connection;
            }
        }
        return null;
    }
    initiateCommunication(socket) {
        // Send the protocol version
        const deferred = (0, Util_1.deferredPromise)();
        socket.write(BINARY_PROTOCOL_VERSION, (err) => {
            if (err) {
                deferred.reject(err);
            }
            deferred.resolve();
        });
        return deferred.promise;
    }
    triggerConnect(translatedAddress) {
        if (this.clientConfig.network.ssl.enabled) {
            if (this.clientConfig.network.ssl.sslOptions) {
                const opts = this.clientConfig.network.ssl.sslOptions;
                return this.connectTLSSocket(translatedAddress, opts);
            }
            else if (this.clientConfig.network.ssl.sslOptionsFactory
                || this.clientConfig.network.ssl.sslOptionsFactoryProperties) {
                const factoryProperties = this.clientConfig.network.ssl.sslOptionsFactoryProperties;
                let factory = this.clientConfig.network.ssl.sslOptionsFactory;
                if (factory == null) {
                    factory = new BasicSSLOptionsFactory_1.BasicSSLOptionsFactory();
                }
                return factory.init(factoryProperties).then(() => {
                    return this.connectTLSSocket(translatedAddress, factory.getSSLOptions());
                });
            }
            else {
                // the default behavior when ssl is enabled
                const opts = this.clientConfig.network.ssl.sslOptions = {
                    checkServerIdentity: () => null,
                    rejectUnauthorized: true,
                };
                return this.connectTLSSocket(translatedAddress, opts);
            }
        }
        else {
            return this.connectNetSocket(translatedAddress);
        }
    }
    connectTLSSocket(address, configOpts) {
        const connectionResolver = (0, Util_1.deferredPromise)();
        const socket = tls.connect(address.port, address.host, configOpts);
        const connectTimeoutTimer = setTimeout(() => {
            socket.destroy();
            connectionResolver.reject(new core_1.HazelcastError('Connection timed out to address ' + address.toString()));
        }, this.connectionTimeoutMillis);
        socket.once('secureConnect', () => {
            clearInterval(connectTimeoutTimer);
            connectionResolver.resolve(socket);
        });
        socket.once('error', (err) => {
            clearInterval(connectTimeoutTimer);
            connectionResolver.reject(err);
        });
        return connectionResolver.promise;
    }
    connectNetSocket(address) {
        const connectionResolver = (0, Util_1.deferredPromise)();
        const socket = net.connect(address.port, address.host);
        const connectTimeoutTimer = setTimeout(() => {
            socket.destroy();
            connectionResolver.reject(new core_1.HazelcastError('Connection timed out to address ' + address.toString()));
        }, this.connectionTimeoutMillis);
        socket.once('connect', () => {
            clearInterval(connectTimeoutTimer);
            connectionResolver.resolve(socket);
        });
        socket.once('error', (err) => {
            clearInterval(connectTimeoutTimer);
            connectionResolver.reject(err);
        });
        return connectionResolver.promise;
    }
    emitConnectionAddedEvent(connection) {
        this.emit(exports.CONNECTION_ADDED_EVENT_NAME, connection);
    }
    emitConnectionRemovedEvent(connection) {
        this.emit(exports.CONNECTION_REMOVED_EVENT_NAME, connection);
    }
    translateAddress(target) {
        const ctx = this.clusterFailoverService.current();
        const addressProvider = ctx.addressProvider;
        return addressProvider.translate(target)
            .catch((error) => {
            this.logger.warn('ConnectionManager', 'Failed to translate address '
                + target + ' via address provider ' + error.message);
            return Promise.reject(error);
        });
    }
    translateMemberAddress(member) {
        if (member.addressMap == null) {
            return this.translateAddress(member.address);
        }
        if (this.clusterService.translateToPublicAddress()) {
            const publicAddress = (0, MemberInfo_1.lookupPublicAddress)(member);
            if (publicAddress != null) {
                return Promise.resolve(publicAddress);
            }
            return Promise.resolve(member.address);
        }
        return this.translateAddress(member.address);
    }
    triggerClusterReconnection() {
        if (this.reconnectMode === ConnectionStrategyConfig_1.ReconnectMode.OFF) {
            this.logger.info('ConnectionManager', 'RECONNECT MODE is off. Shutting down the client.');
            this.shutdownClient();
            return;
        }
        if (this.lifecycleService.isRunning()) {
            this.submitConnectToClusterTask();
        }
    }
    shutdownClient() {
        this.client.shutdown()
            .catch((e) => {
            this.logger.error('ConnectionManager', 'Failed to shut down client.', e);
        });
    }
    // This method makes sure that the smart client has connection to all cluster members.
    // This is called periodically.
    reconnectToMembers() {
        if (!this.lifecycleService.isRunning()) {
            return;
        }
        for (const member of this.clusterService.getMembers()) {
            if (this.connectionRegistry.getClientState() === ClientState.DISCONNECTED_FROM_CLUSTER) {
                // Best effort check to prevent this task from attempting to
                // open a new connection when the client is not connected to any of the cluster members.
                // In such occasions, only `doConnectToCandidateCluster`
                // method should open new connections.
                return;
            }
            if (this.connectionRegistry.getConnection(member.uuid) != null) {
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
    authenticateOnCluster(connection) {
        const request = this.encodeAuthenticationRequest();
        const invocation = new InvocationService_1.Invocation(this.invocationService, request);
        invocation.connection = connection;
        return (0, Util_1.timedPromise)(this.invocationService.invokeUrgent(invocation), this.authenticationTimeout).catch((err) => {
            connection.close('Authentication failed', err);
            throw err;
        }).then((responseMessage) => {
            const response = ClientAuthenticationCodec_1.ClientAuthenticationCodec.decodeResponse(responseMessage);
            let authenticationStatus = response.status;
            if (this.failoverConfigProvided && !response.failoverSupported) {
                this.logger.warn('ConnectionManager', 'Cluster does not support failover. '
                    + 'This feature is available in Hazelcast Enterprise.');
                authenticationStatus = AuthenticationStatus_1.AuthenticationStatus.NOT_ALLOWED_IN_CLUSTER;
            }
            if (authenticationStatus === AuthenticationStatus_1.AuthenticationStatus.AUTHENTICATED) {
                return this.onAuthenticated(connection, response);
            }
            else {
                let err;
                switch (authenticationStatus) {
                    case AuthenticationStatus_1.AuthenticationStatus.CREDENTIALS_FAILED:
                        err = new core_1.AuthenticationError('The configured cluster name on the client '
                            + 'does not match the one configured in the cluster or the credentials '
                            + 'set in the client security config could not be authenticated.');
                        break;
                    case AuthenticationStatus_1.AuthenticationStatus.SERIALIZATION_VERSION_MISMATCH:
                        err = new core_1.IllegalStateError('Server serialization version does not match to client.');
                        break;
                    case AuthenticationStatus_1.AuthenticationStatus.NOT_ALLOWED_IN_CLUSTER:
                        err = new core_1.ClientNotAllowedInClusterError('Client is not allowed in the cluster.');
                        break;
                    default:
                        err = new core_1.AuthenticationError('Authentication status code not supported. Status: '
                            + authenticationStatus);
                }
                connection.close('Authentication failed', err);
                throw err;
            }
        });
    }
    onAuthenticated(connection, response) {
        this.checkPartitionCount(response.partitionCount);
        connection.setConnectedServerVersion(response.serverHazelcastVersion);
        connection.setRemoteAddress(response.address);
        connection.setRemoteUuid(response.memberUuid);
        connection.setClusterUuid(response.clusterId);
        const existingConnection = this.connectionRegistry.getConnection(response.memberUuid);
        if (existingConnection != null) {
            connection.close('Duplicate connection to same member with uuid: '
                + response.memberUuid.toString(), null);
            return existingConnection;
        }
        const newClusterId = response.clusterId;
        const clusterIdChanged = this.clusterId != null && !newClusterId.equals(this.clusterId);
        if (clusterIdChanged) {
            this.checkConnectionStateOnClusterIdChange(connection);
            this.logger.warn('ConnectionManager', 'Switching from current cluster: '
                + this.clusterId + ' to new cluster: ' + newClusterId);
            this.client.onConnectionToNewCluster();
        }
        const connectionsEmpty = this.connectionRegistry.isEmpty();
        this.connectionRegistry.setConnection(response.memberUuid, connection);
        if (connectionsEmpty) {
            this.clusterId = newClusterId;
            if (this.establishedInitialClusterConnection) {
                // In split brain, the client might connect to the one half
                // of the cluster, and then later might reconnect to the
                // other half, after the half it was connected to is
                // completely dead. Since the cluster id is preserved in
                // split brain scenarios, it is impossible to distinguish
                // reconnection to the same cluster vs reconnection to the
                // other half of the split brain. However, in the latter,
                // we might need to send some state to the other half of
                // the split brain (like Compact schemas or user code
                // deployment classes). That forces us to send the client
                // state to the cluster after the first cluster connection,
                // regardless the cluster id is changed or not.
                this.connectionRegistry.setClientState(ClientState.CONNECTED_TO_CLUSTER);
                this.initializeClientOnCluster(newClusterId);
            }
            else {
                this.establishedInitialClusterConnection = true;
                this.connectionRegistry.setClientState(ClientState.INITIALIZED_ON_CLUSTER);
                this.emitLifecycleEvent(LifecycleService_1.LifecycleState.CONNECTED);
            }
        }
        this.logger.info('ConnectionManager', 'Authenticated with server '
            + response.address + ':' + response.memberUuid + ', server version: '
            + response.serverHazelcastVersion + ', local address: ' + connection.getLocalAddress());
        this.emitConnectionAddedEvent(connection);
        return connection;
    }
    checkConnectionStateOnClusterIdChange(connection) {
        if (this.connectionRegistry.isEmpty()) {
            // We only have single connection established
            if (this.failoverConfigProvided) {
                // If failover is provided and this single connection is established after,
                // failover logic kicks in (checked via `switchingToNextCluster`), then it
                // is OK to continue. Otherwise, we force the failover logic
                // to be used by throwing `ClientNotAllowedInClusterError`
                if (this.switchingToNextCluster) {
                    this.switchingToNextCluster = false;
                }
                else {
                    const reason = 'Force to hard cluster switch';
                    connection.close(reason, null);
                    throw new core_1.ClientNotAllowedInClusterError(reason);
                }
            }
        }
        else {
            // If there are other connections, then we have a connection
            // to wrong cluster. We should not stay connected
            const reason = 'Connection does not belong to this cluster';
            connection.close(reason, null);
            throw new core_1.IllegalStateError(reason);
        }
    }
    encodeAuthenticationRequest() {
        const ctx = this.clusterFailoverService.current();
        const clusterName = ctx.clusterName;
        const customCredentials = ctx.customCredentials;
        const securityConfig = ctx.securityConfig;
        const clientVersion = BuildInfo_1.BuildInfo.getClientVersion();
        let clientMessage;
        if (customCredentials != null || securityConfig.token != null || securityConfig.custom != null) {
            // User either provided a customCredentials or explicitly configured
            // a token or custom credentials with the security element.
            const credentialsPayload = this.getCredentialsPayload(customCredentials, securityConfig);
            clientMessage = ClientAuthenticationCustomCodec_1.ClientAuthenticationCustomCodec.encodeRequest(clusterName, credentialsPayload, this.clientUuid, exports.CLIENT_TYPE, SERIALIZATION_VERSION, clientVersion, this.clientName, this.labels);
        }
        else {
            const usernamePasswordCredentials = securityConfig.usernamePassword;
            clientMessage = ClientAuthenticationCodec_1.ClientAuthenticationCodec.encodeRequest(clusterName, usernamePasswordCredentials.username, usernamePasswordCredentials.password, this.clientUuid, exports.CLIENT_TYPE, SERIALIZATION_VERSION, clientVersion, this.clientName, this.labels);
        }
        return clientMessage;
    }
    getCredentialsPayload(customCredentials, securityConfig) {
        let payload;
        const tokenCredentials = securityConfig.token;
        if (tokenCredentials != null) {
            const token = tokenCredentials.token;
            const encoding = tokenCredentials.encoding;
            payload = Buffer.from(token, encoding);
        }
        else {
            // If we are this far, we ruled out the possibility of credentials being
            // UsernamePasswordCredentials or TokenCredentials. So, it has to
            // be either a customCredentials(deprecated configuration element)
            // or a user specified custom credentials object with the new security
            // configuration.
            payload = this.serializationService.toData(customCredentials || securityConfig.custom).toBuffer();
        }
        return payload;
    }
    checkPartitionCount(newPartitionCount) {
        const partitionService = this.partitionService;
        if (!partitionService.checkAndSetPartitionCount(newPartitionCount)) {
            throw new core_1.ClientNotAllowedInClusterError('Client can not work with this cluster '
                + 'because it has a different partition count. Expected partition count: '
                + partitionService.getPartitionCount() + ', member partition count: ' + newPartitionCount);
        }
    }
    initializeClientOnCluster(targetClusterId) {
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
                this.connectionRegistry.setClientState(ClientState.INITIALIZED_ON_CLUSTER);
                this.emitLifecycleEvent(LifecycleService_1.LifecycleState.CONNECTED);
            }
            else {
                this.logger.warn('ConnectionManager', 'Cannot set client state to initialized on '
                    + 'cluster because current cluster id: ' + this.clusterId
                    + ' is different than expected cluster id: ' + targetClusterId);
            }
        })
            .catch((error) => {
            const clusterName = this.clusterFailoverService.current().clusterName;
            this.logger.warn('ConnectionManager', 'Failure during sending state to the cluster: '
                + error.message);
            if (targetClusterId.equals(this.clusterId)) {
                this.logger.warn('ConnectionManager', 'Retrying sending state to the cluster: '
                    + targetClusterId + ', name: ' + clusterName);
                this.initializeClientOnCluster(targetClusterId);
            }
        });
    }
    tryConnectToAllClusterMembers(members) {
        const promises = [];
        for (const member of members) {
            promises.push(this.getOrConnectToMember(member)
                .catch(() => {
                // no-op
            }));
        }
        return Promise.all(promises)
            .then(() => undefined);
    }
    getTotalBytesWritten() {
        return this.totalBytesWritten;
    }
    getTotalBytesRead() {
        return this.totalBytesRead;
    }
    memberAdded(event) { }
    memberRemoved(event) {
        const member = event.member;
        const connection = this.connectionRegistry.getConnection(member.uuid);
        if (connection !== undefined) {
            connection.close(null, new core_1.TargetDisconnectedError('The client has closed the connection to this member,'
                + ' after receiving a member left event from the cluster. ' + connection));
        }
    }
}
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=ConnectionManager.js.map