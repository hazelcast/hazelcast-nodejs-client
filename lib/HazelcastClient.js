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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazelcastClient = void 0;
const core_1 = require("./core");
const ClientGetDistributedObjectsCodec_1 = require("./codec/ClientGetDistributedObjectsCodec");
const ConfigBuilder_1 = require("./config/ConfigBuilder");
const FailoverConfigBuilder_1 = require("./config/FailoverConfigBuilder");
const ConnectionManager_1 = require("./network/ConnectionManager");
const ClusterService_1 = require("./invocation/ClusterService");
const InvocationService_1 = require("./invocation/InvocationService");
const LifecycleService_1 = require("./LifecycleService");
const ListenerService_1 = require("./listener/ListenerService");
const LoggingService_1 = require("./logging/LoggingService");
const RepairingTask_1 = require("./nearcache/RepairingTask");
const PartitionService_1 = require("./PartitionService");
const ErrorFactory_1 = require("./protocol/ErrorFactory");
const ProxyManager_1 = require("./proxy/ProxyManager");
const CPSubsystem_1 = require("./CPSubsystem");
const ClusterFailoverService_1 = require("./ClusterFailoverService");
const LockReferenceIdGenerator_1 = require("./proxy/LockReferenceIdGenerator");
const SerializationService_1 = require("./serialization/SerializationService");
const Statistics_1 = require("./statistics/Statistics");
const NearCacheManager_1 = require("./nearcache/NearCacheManager");
const LoadBalancerConfig_1 = require("./config/LoadBalancerConfig");
const RandomLB_1 = require("./util/RandomLB");
const RoundRobinLB_1 = require("./util/RoundRobinLB");
const ClusterViewListenerService_1 = require("./listener/ClusterViewListenerService");
const ConnectionRegistry_1 = require("./network/ConnectionRegistry");
const SqlService_1 = require("./sql/SqlService");
const SchemaService_1 = require("./serialization/compact/SchemaService");
/**
 * Hazelcast client instance. When you want to use Hazelcast's distributed
 * data structures, you must first create a client instance. Multiple
 * instances can be created on a single Node.js process.
 *
 * Client instances should be shut down explicitly.
 */
class HazelcastClient {
    /** @internal */
    constructor(config, failoverConfig) {
        /** @internal */
        this.id = HazelcastClient.CLIENT_ID++;
        if (config != null) {
            this.config = config;
        }
        else {
            this.config = failoverConfig.clientConfigs[0];
        }
        this.loadBalancer = this.initLoadBalancer();
        this.failoverConfig = failoverConfig;
        this.errorFactory = new ErrorFactory_1.ClientErrorFactory();
        this.loggingService = new LoggingService_1.LoggingService(this.config.customLogger, this.config.properties['hazelcast.logging.level']);
        const logger = this.loggingService.getLogger();
        this.schemaService = new SchemaService_1.SchemaService(this.config, () => this.clusterService, () => this.invocationService, logger);
        this.serializationService = new SerializationService_1.SerializationServiceV1(this.config.serialization, this.schemaService);
        this.instanceName = this.config.instanceName || 'hz.client_' + this.id;
        this.nearCacheManager = new NearCacheManager_1.NearCacheManager(this.config, this.serializationService);
        this.partitionService = new PartitionService_1.PartitionServiceImpl(logger, this.serializationService);
        this.lifecycleService = new LifecycleService_1.LifecycleServiceImpl(this.config.lifecycleListeners, logger);
        this.clusterFailoverService = HazelcastClient.initClusterFailoverService(this.failoverConfig, this.config, this.lifecycleService, this.loggingService);
        this.clusterService = new ClusterService_1.ClusterService(this.config, logger, this.clusterFailoverService);
        this.connectionRegistry = new ConnectionRegistry_1.ConnectionRegistryImpl(this.config.connectionStrategy.asyncStart, this.config.connectionStrategy.reconnectMode, this.config.network.smartRouting, this.loadBalancer, this.clusterService);
        this.invocationService = new InvocationService_1.InvocationService(this.config, logger, this.partitionService, this.errorFactory, this.lifecycleService, this.connectionRegistry, this.schemaService, this.serializationService);
        this.connectionManager = new ConnectionManager_1.ConnectionManager(this, this.instanceName, this.config, logger, this.partitionService, this.serializationService, this.lifecycleService, this.clusterFailoverService, this.failoverConfig != null, this.clusterService, this.invocationService, this.connectionRegistry);
        this.listenerService = new ListenerService_1.ListenerService(logger, this.config.network.smartRouting, this.connectionManager, this.invocationService);
        this.lockReferenceIdGenerator = new LockReferenceIdGenerator_1.LockReferenceIdGenerator();
        this.proxyManager = new ProxyManager_1.ProxyManager(this.config, logger, this.invocationService, this.listenerService, this.partitionService, this.serializationService, this.nearCacheManager, () => this.getRepairingTask(), this.clusterService, this.lockReferenceIdGenerator, this.connectionRegistry, this.schemaService);
        this.statistics = new Statistics_1.Statistics(this.loggingService.getLogger(), this.config.metrics, this.instanceName, this.invocationService, this.nearCacheManager, this.connectionManager);
        this.clusterViewListenerService = new ClusterViewListenerService_1.ClusterViewListenerService(logger, this.connectionManager, this.partitionService, this.clusterService, this.invocationService);
        this.cpSubsystem = new CPSubsystem_1.CPSubsystemImpl(logger, this.instanceName, this.invocationService, this.serializationService);
        this.sqlService = new SqlService_1.SqlServiceImpl(this.serializationService, this.invocationService, this.connectionManager);
    }
    /**
     * Creates a new client object and automatically connects to cluster.
     * @param config Client config. Default client config is used when this parameter
     *               is absent.
     * @throws {@link InvalidConfigurationError} before returning if `config` is not a valid configuration object.
     * @returns a new client instance
     */
    static newHazelcastClient(config) {
        const configBuilder = new ConfigBuilder_1.ConfigBuilder(config);
        const effectiveConfig = configBuilder.build();
        const client = new HazelcastClient(effectiveConfig);
        return client.init();
    }
    /**
     * Creates a client with cluster switch capability. Client will try to connect
     * to alternative clusters according to failover configuration when it disconnects
     * from a cluster.
     *
     * @param failoverConfig Configuration object describing the failover client configs and try count
     * @returns a new client instance
     * @throws {@link InvalidConfigurationError} before returning if the provided failover configuration is not valid
     */
    static newHazelcastFailoverClient(failoverConfig) {
        const configBuilder = new FailoverConfigBuilder_1.FailoverConfigBuilder(failoverConfig);
        const effectiveConfig = configBuilder.build();
        const client = new HazelcastClient(null, effectiveConfig);
        return client.init();
    }
    /**
     * Returns the name of this Hazelcast instance.
     */
    getName() {
        return this.instanceName;
    }
    /**
     * Gathers information of this local client.
     */
    getLocalEndpoint() {
        const connection = this.connectionRegistry.getRandomConnection();
        const localAddress = connection != null ? connection.getLocalAddress() : null;
        const info = new core_1.ClientInfo();
        info.uuid = this.connectionManager.getClientUuid();
        info.localAddress = localAddress;
        info.labels = new Set(this.config.clientLabels);
        info.name = this.instanceName;
        return info;
    }
    /**
     * Returns all {@link DistributedObject}s, that is all maps, queues, topics, locks etc.
     *
     * The results are returned on a best-effort basis. The result might miss
     * just-created objects and contain just-deleted objects. An existing
     * object can also be missing from the list occasionally. One cluster
     * member is queried to obtain the list.
     *
     * @return the collection of all instances in the cluster
     */
    getDistributedObjects() {
        const clientMessage = ClientGetDistributedObjectsCodec_1.ClientGetDistributedObjectsCodec.encodeRequest();
        let localDistributedObjects;
        let responseMessage;
        return this.invocationService.invokeOnRandomTarget(clientMessage, x => x)
            .then((resp) => {
            responseMessage = resp;
            return this.proxyManager.getDistributedObjects();
        }).then((distributedObjects) => {
            localDistributedObjects = new Set();
            distributedObjects.forEach((obj) => {
                localDistributedObjects.add(obj.getServiceName() + ProxyManager_1.NAMESPACE_SEPARATOR + obj.getName());
            });
            const newDistributedObjectInfos = ClientGetDistributedObjectsCodec_1.ClientGetDistributedObjectsCodec.decodeResponse(responseMessage);
            const createLocalProxiesPromise = newDistributedObjectInfos.map((doi) => {
                return this.proxyManager.getOrCreateProxy(doi.name, doi.serviceName, false)
                    .then(() => localDistributedObjects.delete(doi.serviceName + ProxyManager_1.NAMESPACE_SEPARATOR + doi.name));
            });
            return Promise.all(createLocalProxiesPromise);
        })
            .then(() => {
            const destroyLocalProxiesPromises = new Array(localDistributedObjects.size);
            let index = 0;
            localDistributedObjects.forEach((namespace) => {
                destroyLocalProxiesPromises[index++] = this.proxyManager.destroyProxyLocally(namespace);
            });
            return Promise.all(destroyLocalProxiesPromises);
        })
            .then(() => {
            return this.proxyManager.getDistributedObjects();
        });
    }
    /**
     * Returns the distributed Map instance with given name.
     */
    getMap(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.MAP_SERVICE);
    }
    /**
     * Returns the distributed Set instance with given name.
     */
    getSet(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.SET_SERVICE);
    }
    /**
     * Returns the distributed Queue instance with given name.
     */
    getQueue(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.QUEUE_SERVICE);
    }
    /**
     * Returns the distributed List instance with given name.
     */
    getList(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.LIST_SERVICE);
    }
    /**
     * Returns the distributed MultiMap instance with given name.
     */
    getMultiMap(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.MULTIMAP_SERVICE);
    }
    /**
     * Returns a distributed Ringbuffer instance with the given name.
     */
    getRingbuffer(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.RINGBUFFER_SERVICE);
    }
    /**
     * Returns a distributed Reliable Topic instance with the given name.
     */
    getReliableTopic(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.RELIABLETOPIC_SERVICE);
    }
    /**
     * Returns the distributed Replicated Map instance with given name.
     */
    getReplicatedMap(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.REPLICATEDMAP_SERVICE);
    }
    /**
     * Returns the distributed Flake ID Generator instance with given name.
     */
    getFlakeIdGenerator(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.FLAKEID_SERVICE);
    }
    /**
     * Returns the distributed PN Counter instance with given name.
     */
    getPNCounter(name) {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager_1.ProxyManager.PNCOUNTER_SERVICE);
    }
    /**
     * Returns the CP subsystem that offers a set of in-memory linearizable
     * data structures.
     */
    getCPSubsystem() {
        return this.cpSubsystem;
    }
    /**
     * Returns configuration that this instance started with.
     * The returned object should not be modified.
     */
    getConfig() {
        return this.config;
    }
    /**
     * Returns the Cluster to which this client is connected.
     */
    getCluster() {
        return this.clusterService;
    }
    /**
     * Returns the lifecycle service for this client.
     */
    getLifecycleService() {
        return this.lifecycleService;
    }
    /**
     * Returns the partition service of this client.
     */
    getPartitionService() {
        return this.partitionService;
    }
    /** @internal */
    getSerializationService() {
        return this.serializationService;
    }
    /** @internal */
    getInvocationService() {
        return this.invocationService;
    }
    /** @internal */
    getListenerService() {
        return this.listenerService;
    }
    /** @internal */
    getConnectionManager() {
        return this.connectionManager;
    }
    /** @internal */
    getClusterService() {
        return this.clusterService;
    }
    /** @internal */
    getRepairingTask() {
        if (this.mapRepairingTask == null) {
            this.mapRepairingTask = new RepairingTask_1.RepairingTask(this.config.properties, this.loggingService.getLogger(), this.partitionService, this.lifecycleService, this.invocationService, this.clusterService, this.connectionManager.getClientUuid());
        }
        return this.mapRepairingTask;
    }
    /** @internal */
    getLoggingService() {
        return this.loggingService;
    }
    /**
     * Returns a service to execute distributed SQL queries.
     *
     * @returns SQL service
     *
     * see {@link SqlService}
     */
    getSql() {
        return this.sqlService;
    }
    /**
     * Registers a distributed object listener to cluster.
     * @param listener distributed object listener function. This will be called with {@link DistributedObjectEvent}.
     * @returns registration id of the listener.
     */
    addDistributedObjectListener(listener) {
        return this.listenerService.addDistributedObjectListener(listener);
    }
    /**
     * Removes a distributed object listener from the cluster.
     * @param listenerId id of the listener to be removed.
     * @returns `true` if registration was removed, `false` otherwise.
     */
    removeDistributedObjectListener(listenerId) {
        return this.listenerService.deregisterListener(listenerId);
    }
    /** @internal */
    getErrorFactory() {
        return this.errorFactory;
    }
    /**
     * Shuts down this client instance.
     *
     * @return Shutdown promise. Multiple invocations will return the same promise.
     */
    shutdown() {
        if (this.shutdownPromise) { // return the initiated shutdown promise if it exists.
            return this.shutdownPromise;
        }
        this.lifecycleService.onShutdownStart();
        if (this.mapRepairingTask !== undefined) {
            this.mapRepairingTask.shutdown();
        }
        this.nearCacheManager.destroyAllNearCaches();
        this.proxyManager.destroy();
        this.statistics.stop();
        this.shutdownPromise = this.cpSubsystem.shutdown()
            .then(() => {
            this.invocationService.shutdown();
            this.connectionManager.shutdown();
        })
            .then(() => {
            this.lifecycleService.onShutdownFinished();
        });
        return this.shutdownPromise;
    }
    /** @internal */
    onConnectionToNewCluster() {
        this.getLoggingService().getLogger()
            .info('HazelcastClient', 'Clearing local state of the client, because of a cluster restart.');
        this.nearCacheManager.clearAllNearCaches();
        this.clusterService.onClusterConnect();
    }
    /** @internal */
    sendStateToCluster() {
        return this.schemaService.sendAllSchemas().then(() => {
            return this.proxyManager.createDistributedObjectsOnCluster();
        });
    }
    /** @internal */
    onTryToConnectNextCluster() {
        this.getLoggingService().getLogger()
            .info('HazelcastClient', 'Resetting local state of the client, because of a cluster change.');
        // clear near caches
        this.nearCacheManager.clearAllNearCaches();
        // reset the member list version
        this.clusterService.onTryToConnectNextCluster();
        // clear partition service
        this.partitionService.reset();
        // close all the connections, consequently waiting invocations get TargetDisconnectedError;
        // non retryable client messages will fail immediately;
        // retryable client messages will be retried, but they will wait for new partition table
        this.connectionManager.reset();
    }
    /** @internal */
    init() {
        const logger = this.loggingService.getLogger();
        try {
            this.lifecycleService.start();
            const configuredMembershipListeners = this.config.membershipListeners;
            this.clusterService.start(configuredMembershipListeners);
            this.clusterViewListenerService.start();
        }
        catch (e) {
            logger.error('HazelcastClient', 'Client failed to start.', e);
            throw e;
        }
        return this.connectionManager.start()
            .then(() => {
            const connectionStrategyConfig = this.config.connectionStrategy;
            if (!connectionStrategyConfig.asyncStart) {
                return this.clusterService.waitForInitialMemberList()
                    .then(() => this.connectionManager.connectToAllClusterMembers());
            }
        })
            .then(() => {
            this.listenerService.start();
            this.proxyManager.init();
            this.loadBalancer.initLoadBalancer(this.clusterService, this.config);
            this.statistics.start();
            return this.invocationService.start(this.listenerService);
        })
            .then(() => {
            return this;
        })
            .catch((e) => {
            this.shutdown()
                .catch((e) => {
                logger.warn('HazelcastClient', 'Could not shut down after start failure.', e);
            });
            logger.error('HazelcastClient', 'Client failed to start.', e);
            throw e;
        });
    }
    /** @internal */
    initLoadBalancer() {
        let lb = this.config.loadBalancer.customLoadBalancer;
        if (lb == null) {
            if (this.config.loadBalancer.type === LoadBalancerConfig_1.LoadBalancerType.ROUND_ROBIN) {
                lb = new RoundRobinLB_1.RoundRobinLB();
            }
            else if (this.config.loadBalancer.type === LoadBalancerConfig_1.LoadBalancerType.RANDOM) {
                lb = new RandomLB_1.RandomLB();
            }
            else {
                throw new core_1.IllegalStateError('Load balancer type ' + this.config.loadBalancer.type
                    + ' is not supported.');
            }
        }
        return lb;
    }
    /** @internal */
    static initClusterFailoverService(failoverConfig, config, lifecycleService, loggingService) {
        let tryCount;
        let clientConfigs;
        if (failoverConfig == null) {
            tryCount = 0;
            clientConfigs = [config];
        }
        else {
            tryCount = failoverConfig.tryCount;
            clientConfigs = failoverConfig.clientConfigs;
        }
        const builder = new ClusterFailoverService_1.ClusterFailoverServiceBuilder(tryCount, clientConfigs, lifecycleService, loggingService);
        return builder.build();
    }
}
exports.HazelcastClient = HazelcastClient;
/** @internal */
HazelcastClient.CLIENT_ID = 0;
//# sourceMappingURL=HazelcastClient.js.map