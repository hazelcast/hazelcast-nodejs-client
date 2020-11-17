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

import {
    ClientInfo,
    Cluster,
    DistributedObject,
    DistributedObjectListener,
    LoadBalancer,
    IllegalStateError
} from './core';
import {ClientGetDistributedObjectsCodec} from './codec/ClientGetDistributedObjectsCodec';
import {ClientConfig, ClientConfigImpl} from './config/Config';
import {ConfigBuilder} from './config/ConfigBuilder';
import {ClientConnectionManager} from './network/ClientConnectionManager';
import {ClusterService} from './invocation/ClusterService';
import {InvocationService} from './invocation/InvocationService';
import {LifecycleService, LifecycleServiceImpl} from './LifecycleService';
import {ListenerService} from './listener/ListenerService';
import {LoggingService} from './logging/LoggingService';
import {RepairingTask} from './nearcache/RepairingTask';
import {PartitionService, PartitionServiceImpl} from './PartitionService';
import {ClientErrorFactory} from './protocol/ErrorFactory';
import {
    FlakeIdGenerator,
    IList,
    IMap,
    IQueue,
    ISet,
    ITopic,
    MultiMap,
    ReplicatedMap,
    Ringbuffer,
    PNCounter
} from './proxy';
import {ProxyManager, NAMESPACE_SEPARATOR} from './proxy/ProxyManager';
import {CPSubsystem, CPSubsystemImpl} from './CPSubsystem';
import {LockReferenceIdGenerator} from './proxy/LockReferenceIdGenerator';
import {SerializationService, SerializationServiceV1} from './serialization/SerializationService';
import {AddressProvider} from './connection/AddressProvider';
import {HazelcastCloudAddressProvider} from './discovery/HazelcastCloudAddressProvider';
import {DefaultAddressProvider} from './connection/DefaultAddressProvider';
import {HazelcastCloudDiscovery} from './discovery/HazelcastCloudDiscovery';
import {Statistics} from './statistics/Statistics';
import {NearCacheManager} from './nearcache/NearCacheManager';
import {LoadBalancerType} from './config/LoadBalancerConfig';
import {RandomLB} from './util/RandomLB';
import {RoundRobinLB} from './util/RoundRobinLB';
import {ClusterViewListenerService} from './listener/ClusterViewListenerService';
import {ClientMessage} from './protocol/ClientMessage';

/**
 * Hazelcast client instance. When you want to use Hazelcast's distributed
 * data structures, you must first create a client instance. Multiple
 * instances can be created on a single Node.js process.
 *
 * Client instances should be shut down explicitly.
 */
export class HazelcastClient {

    /** @internal */
    private static CLIENT_ID = 0;

    /** @internal */
    private readonly instanceName: string;
    /** @internal */
    private readonly id: number = HazelcastClient.CLIENT_ID++;
    /** @internal */
    private readonly config: ClientConfigImpl;
    /** @internal */
    private readonly loggingService: LoggingService;
    /** @internal */
    private readonly serializationService: SerializationService;
    /** @internal */
    private readonly invocationService: InvocationService;
    /** @internal */
    private readonly listenerService: ListenerService;
    /** @internal */
    private readonly connectionManager: ClientConnectionManager;
    /** @internal */
    private readonly partitionService: PartitionServiceImpl;
    /** @internal */
    private readonly clusterService: ClusterService;
    /** @internal */
    private readonly lifecycleService: LifecycleServiceImpl;
    /** @internal */
    private readonly proxyManager: ProxyManager;
    /** @internal */
    private readonly cpSubsystem: CPSubsystemImpl;
    /** @internal */
    private readonly nearCacheManager: NearCacheManager;
    /** @internal */
    private readonly lockReferenceIdGenerator: LockReferenceIdGenerator;
    /** @internal */
    private readonly errorFactory: ClientErrorFactory;
    /** @internal */
    private readonly statistics: Statistics;
    /** @internal */
    private readonly addressProvider: AddressProvider;
    /** @internal */
    private readonly loadBalancer: LoadBalancer;
    /** @internal */
    private readonly clusterViewListenerService: ClusterViewListenerService;
    /** @internal */
    private mapRepairingTask: RepairingTask;

    /** @internal */
    constructor(config: ClientConfigImpl) {
        this.config = config;
        this.instanceName = config.instanceName || 'hz.client_' + this.id;
        this.loggingService = new LoggingService(this.config.customLogger,
            this.config.properties['hazelcast.logging.level'] as string);
        this.loadBalancer = this.initLoadBalancer();
        this.listenerService = new ListenerService(this);
        this.serializationService = new SerializationServiceV1(this.config.serialization);
        this.nearCacheManager = new NearCacheManager(this);
        this.partitionService = new PartitionServiceImpl(this);
        this.addressProvider = this.createAddressProvider();
        this.connectionManager = new ClientConnectionManager(this);
        this.invocationService = new InvocationService(this);
        this.proxyManager = new ProxyManager(this);
        this.cpSubsystem = new CPSubsystemImpl(this);
        this.clusterService = new ClusterService(this);
        this.lifecycleService = new LifecycleServiceImpl(this);
        this.lockReferenceIdGenerator = new LockReferenceIdGenerator();
        this.errorFactory = new ClientErrorFactory();
        this.statistics = new Statistics(this);
        this.clusterViewListenerService = new ClusterViewListenerService(this);
    }

    /**
     * Creates a new client object and automatically connects to cluster.
     * @param config Default client config is used when this parameter is absent.
     * @returns a new client instance
     */
    static newHazelcastClient(config?: ClientConfig): Promise<HazelcastClient> {
        const configBuilder = new ConfigBuilder(config);
        const effectiveConfig = configBuilder.build();
        const client = new HazelcastClient(effectiveConfig);
        return client.init();
    }

    /**
     * Returns the name of this Hazelcast instance.
     */
    getName(): string {
        return this.instanceName;
    }

    /**
     * Gathers information of this local client.
     */
     getLocalEndpoint(): ClientInfo {
        return this.clusterService.getLocalClient();
    }

    /**
     * Gives all known distributed objects in cluster.
     */
    getDistributedObjects(): Promise<DistributedObject[]> {
        const clientMessage = ClientGetDistributedObjectsCodec.encodeRequest();
        let localDistributedObjects: Set<string>;
        let responseMessage: ClientMessage;
        return this.invocationService.invokeOnRandomTarget(clientMessage)
            .then((resp) => {
                responseMessage = resp;
                return this.proxyManager.getDistributedObjects();
            })
            .then((distributedObjects) => {
                localDistributedObjects = new Set<string>();
                distributedObjects.forEach((obj) => {
                    localDistributedObjects.add(obj.getServiceName() + NAMESPACE_SEPARATOR + obj.getName());
                });

                const newDistributedObjectInfos = ClientGetDistributedObjectsCodec.decodeResponse(responseMessage);
                const createLocalProxiesPromise = newDistributedObjectInfos.map((doi) => {
                    return this.proxyManager.getOrCreateProxy(doi.name, doi.serviceName, false)
                        .then(() => localDistributedObjects.delete(doi.serviceName + NAMESPACE_SEPARATOR + doi.name));
                });

                return Promise.all(createLocalProxiesPromise);
            })
            .then(() => {
                const destroyLocalProxiesPromises = new Array<Promise<void>>(localDistributedObjects.size);
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
    getMap<K, V>(name: string): Promise<IMap<K, V>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.MAP_SERVICE) as Promise<IMap<K, V>>;
    }

    /**
     * Returns the distributed Set instance with given name.
     */
    getSet<E>(name: string): Promise<ISet<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.SET_SERVICE) as Promise<ISet<E>>;
    }

    /**
     * Returns the distributed Queue instance with given name.
     */
    getQueue<E>(name: string): Promise<IQueue<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.QUEUE_SERVICE) as Promise<IQueue<E>>;
    }

    /**
     * Returns the distributed List instance with given name.
     */
    getList<E>(name: string): Promise<IList<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.LIST_SERVICE) as Promise<IList<E>>;
    }

    /**
     * Returns the distributed MultiMap instance with given name.
     */
    getMultiMap<K, V>(name: string): Promise<MultiMap<K, V>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.MULTIMAP_SERVICE) as Promise<MultiMap<K, V>>;
    }

    /**
     * Returns a distributed Ringbuffer instance with the given name.
     */
    getRingbuffer<E>(name: string): Promise<Ringbuffer<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.RINGBUFFER_SERVICE) as Promise<Ringbuffer<E>>;
    }

    /**
     * Returns a distributed Reliable Topic instance with the given name.
     */
    getReliableTopic<E>(name: string): Promise<ITopic<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.RELIABLETOPIC_SERVICE) as Promise<ITopic<E>>;
    }

    /**
     * Returns the distributed Replicated Map instance with given name.
     */
    getReplicatedMap<K, V>(name: string): Promise<ReplicatedMap<K, V>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.REPLICATEDMAP_SERVICE) as Promise<ReplicatedMap<K, V>>;
    }

    /**
     * Returns the distributed Flake ID Generator instance with given name.
     */
    getFlakeIdGenerator(name: string): Promise<FlakeIdGenerator> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.FLAKEID_SERVICE) as Promise<FlakeIdGenerator>;
    }

    /**
     * Returns the distributed PN Counter instance with given name.
     */
    getPNCounter(name: string): Promise<PNCounter> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.PNCOUNTER_SERVICE) as Promise<PNCounter>;
    }

    /**
     * Returns the CP subsystem that offers a set of in-memory linearizable
     * data structures.
     */
    getCPSubsystem(): CPSubsystem {
        return this.cpSubsystem;
    }

    /**
     * Returns configuration that this instance started with.
     * The returned object should not be modified.
     */
    getConfig(): ClientConfig {
        return this.config;
    }

    /**
     * Returns the Cluster to which this client is connected.
     */
    getCluster(): Cluster {
        return this.clusterService;
    }

    /**
     * Returns the lifecycle service for this client.
     */
    getLifecycleService(): LifecycleService {
        return this.lifecycleService;
    }

    /**
     * Returns the partition service of this client.
     */
    getPartitionService(): PartitionService {
        return this.partitionService;
    }

    /** @internal */
    getSerializationService(): SerializationService {
        return this.serializationService;
    }

    /** @internal */
    getInvocationService(): InvocationService {
        return this.invocationService;
    }

    /** @internal */
    getListenerService(): ListenerService {
        return this.listenerService;
    }

    /** @internal */
    getConnectionManager(): ClientConnectionManager {
        return this.connectionManager;
    }

    /** @internal */
    getProxyManager(): ProxyManager {
        return this.proxyManager;
    }

    /** @internal */
    getNearCacheManager(): NearCacheManager {
        return this.nearCacheManager;
    }

    /** @internal */
    getClusterService(): ClusterService {
        return this.clusterService;
    }

    /** @internal */
    getRepairingTask(): RepairingTask {
        if (this.mapRepairingTask == null) {
            this.mapRepairingTask = new RepairingTask(this);
        }
        return this.mapRepairingTask;
    }

    /** @internal */
    getLoggingService(): LoggingService {
        return this.loggingService;
    }

    /**
     * Registers a distributed object listener to cluster.
     * @param listener distributed object listener function.
     * @returns registration id of the listener.
     */
    addDistributedObjectListener(listener: DistributedObjectListener): Promise<string> {
        return this.proxyManager.addDistributedObjectListener(listener);
    }

    /**
     * Removes a distributed object listener from cluster.
     * @param listenerId id of the listener to be removed.
     * @returns `true` if registration was removed, `false` otherwise.
     */
    removeDistributedObjectListener(listenerId: string): Promise<boolean> {
        return this.proxyManager.removeDistributedObjectListener(listenerId);
    }

    /** @internal */
    getLockReferenceIdGenerator(): LockReferenceIdGenerator {
        return this.lockReferenceIdGenerator;
    }

    /** @internal */
    getErrorFactory(): ClientErrorFactory {
        return this.errorFactory;
    }

    /** @internal */
    getAddressProvider(): AddressProvider {
        return this.addressProvider;
    }

    /** @internal */
    getLoadBalancer(): LoadBalancer {
        return this.loadBalancer;
    }

    /** @internal */
    doShutdown(): Promise<void> {
        if (this.mapRepairingTask !== undefined) {
            this.mapRepairingTask.shutdown();
        }
        this.nearCacheManager.destroyAllNearCaches();
        this.proxyManager.destroy();
        this.statistics.stop();
        return this.cpSubsystem.shutdown()
            .then(() => {
                this.connectionManager.shutdown();
                this.invocationService.shutdown();
            });
    }

    /**
     * Shuts down this client instance.
     */
    shutdown(): Promise<void> {
        return this.lifecycleService.shutdown();
    }

    /** @internal */
    onClusterRestart(): void {
        this.getLoggingService().getLogger()
            .info('HazelcastClient', 'Clearing local state of the client, because of a cluster restart');
        this.nearCacheManager.clearAllNearCaches();
        this.clusterService.clearMemberListVersion();
    }

    /** @internal */
    sendStateToCluster(): Promise<void> {
        return this.proxyManager.createDistributedObjectsOnCluster();
    }

    /** @internal */
    private init(): Promise<HazelcastClient> {
        const logger = this.loggingService.getLogger();
        try {
            this.lifecycleService.start();
            const configuredMembershipListeners = this.config.membershipListeners;
            this.clusterService.start(configuredMembershipListeners);
            this.clusterViewListenerService.start();
        } catch (e) {
            logger.error('HazelcastClient', 'Client failed to start', e);
            throw e;
        }

        return this.connectionManager.start()
            .then(() => {
                const connectionStrategyConfig = this.config.connectionStrategy;
                if (!connectionStrategyConfig.asyncStart) {
                    return this.clusterService.waitInitialMemberListFetched()
                        .then(() => this.connectionManager.connectToAllClusterMembers())
                        .then(() => this.invocationService.start());
                } else {
                    this.invocationService.start()
                        .catch((e) => {
                            logger.warn('HazelcastClient', 'InvocationService failed to start', e);
                        });
                }
            })
            .then(() => {
                this.listenerService.start();
                this.proxyManager.init();
                this.loadBalancer.initLoadBalancer(this.clusterService, this.config);
                this.statistics.start();
                return this.invocationService.start();
            })
            .then(() => {
                return this.sendStateToCluster();
            })
            .then(() => {
                return this;
            })
            .catch((e) => {
                logger.error('HazelcastClient', 'Client failed to start', e);
                throw e;
            });
    }

    /** @internal */
    private initLoadBalancer(): LoadBalancer {
        let lb = this.config.loadBalancer.customLoadBalancer;
        if (lb == null) {
            if (this.config.loadBalancer.type === LoadBalancerType.ROUND_ROBIN) {
                lb = new RoundRobinLB();
            } else if (this.config.loadBalancer.type === LoadBalancerType.RANDOM) {
                lb = new RandomLB();
            } else {
                throw new IllegalStateError('Load balancer type ' + this.config.loadBalancer.type
                    + ' is not supported.');
            }
        }
        return lb;
    }

    /** @internal */
    private createAddressProvider(): AddressProvider {
        const networkConfig = this.config.network;

        const addressListProvided = networkConfig.clusterMembers.length !== 0;
        const hazelcastCloudToken = networkConfig.hazelcastCloud.discoveryToken;
        if (addressListProvided && hazelcastCloudToken != null) {
            throw new IllegalStateError('Only one discovery method can be enabled at a time. '
                + 'Cluster members given explicitly: ' + addressListProvided
                + ', hazelcastCloud enabled');
        }

        const cloudAddressProvider = this.initCloudAddressProvider();
        if (cloudAddressProvider != null) {
            return cloudAddressProvider;
        }

        return new DefaultAddressProvider(networkConfig);
    }

    /** @internal */
    private initCloudAddressProvider(): HazelcastCloudAddressProvider {
        const cloudConfig = this.getConfig().network.hazelcastCloud;
        const discoveryToken = cloudConfig.discoveryToken;
        if (discoveryToken != null) {
            const urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(this.getConfig().properties, discoveryToken);
            return new HazelcastCloudAddressProvider(urlEndpoint, this.getConnectionTimeoutMillis(),
                this.loggingService.getLogger());
        }
        return null;
    }

    /** @internal */
    private getConnectionTimeoutMillis(): number {
        const networkConfig = this.getConfig().network;
        const connTimeout = networkConfig.connectionTimeout;
        return connTimeout === 0 ? Number.MAX_VALUE : connTimeout;
    }
}
