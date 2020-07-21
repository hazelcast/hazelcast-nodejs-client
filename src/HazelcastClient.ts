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

import * as Promise from 'bluebird';
import {ClientInfo} from './ClientInfo';
import {ClientGetDistributedObjectsCodec} from './codec/ClientGetDistributedObjectsCodec';
import {ClientConfig, ClientConfigImpl} from './config/Config';
import {ConfigBuilder} from './config/ConfigBuilder';
import {DistributedObject} from './DistributedObject';
import {ClientConnectionManager} from './network/ClientConnectionManager';
import {ClusterService} from './invocation/ClusterService';
import {InvocationService} from './invocation/InvocationService';
import {LifecycleService} from './LifecycleService';
import {ListenerService} from './ListenerService';
import {LockReferenceIdGenerator} from './LockReferenceIdGenerator';
import {LoggingService} from './logging/LoggingService';
import {RepairingTask} from './nearcache/RepairingTask';
import {PartitionService} from './PartitionService';
import {ClientErrorFactory} from './protocol/ErrorFactory';
import {FlakeIdGenerator} from './proxy/FlakeIdGenerator';
import {IList} from './proxy/IList';
import {IMap} from './proxy/IMap';
import {IQueue} from './proxy/IQueue';
import {ReplicatedMap} from './proxy/ReplicatedMap';
import {Ringbuffer} from './proxy/Ringbuffer';
import {ISet} from './proxy/ISet';
import {MultiMap} from './proxy/MultiMap';
import {PNCounter} from './proxy/PNCounter';
import {ProxyManager, NAMESPACE_SEPARATOR} from './proxy/ProxyManager';
import {ITopic} from './proxy/topic/ITopic';
import {SerializationService, SerializationServiceV1} from './serialization/SerializationService';
import {AddressProvider} from './connection/AddressProvider';
import {HazelcastCloudAddressProvider} from './discovery/HazelcastCloudAddressProvider';
import {DefaultAddressProvider} from './connection/DefaultAddressProvider';
import {HazelcastCloudDiscovery} from './discovery/HazelcastCloudDiscovery';
import {Statistics} from './statistics/Statistics';
import {NearCacheManager} from './nearcache/NearCacheManager';
import {DistributedObjectListener} from './core/DistributedObjectListener';
import {IllegalStateError} from './HazelcastError';
import {LoadBalancer} from './LoadBalancer';
import {LoadBalancerType} from './config/LoadBalancerConfig';
import {RandomLB} from './util/RandomLB';
import {RoundRobinLB} from './util/RoundRobinLB';
import {ClusterViewListenerService} from './listener/ClusterViewListenerService';
import {ClientMessage} from './ClientMessage';

export default class HazelcastClient {
    private static CLIENT_ID = 0;

    private readonly instanceName: string;
    private readonly id: number = HazelcastClient.CLIENT_ID++;
    private readonly config: ClientConfigImpl;
    private readonly loggingService: LoggingService;
    private readonly serializationService: SerializationService;
    private readonly invocationService: InvocationService;
    private readonly listenerService: ListenerService;
    private readonly connectionManager: ClientConnectionManager;
    private readonly partitionService: PartitionService;
    private readonly clusterService: ClusterService;
    private readonly lifecycleService: LifecycleService;
    private readonly proxyManager: ProxyManager;
    private readonly nearCacheManager: NearCacheManager;
    private readonly lockReferenceIdGenerator: LockReferenceIdGenerator;
    private readonly errorFactory: ClientErrorFactory;
    private readonly statistics: Statistics;
    private readonly addressProvider: AddressProvider;
    private readonly loadBalancer: LoadBalancer;
    private readonly clusterViewListenerService: ClusterViewListenerService;

    private mapRepairingTask: RepairingTask;

    constructor(config: ClientConfigImpl) {
        this.config = config;
        this.instanceName = config.instanceName || 'hz.client_' + this.id;
        this.loggingService = new LoggingService(this.config.customLogger,
            this.config.properties['hazelcast.logging.level'] as number);
        this.loadBalancer = this.initLoadBalancer();
        this.listenerService = new ListenerService(this);
        this.serializationService = new SerializationServiceV1(this.config.serialization);
        this.nearCacheManager = new NearCacheManager(this);
        this.partitionService = new PartitionService(this);
        this.addressProvider = this.createAddressProvider();
        this.connectionManager = new ClientConnectionManager(this);
        this.invocationService = new InvocationService(this);
        this.proxyManager = new ProxyManager(this);
        this.clusterService = new ClusterService(this);
        this.lifecycleService = new LifecycleService(this);
        this.lockReferenceIdGenerator = new LockReferenceIdGenerator();
        this.errorFactory = new ClientErrorFactory();
        this.statistics = new Statistics(this);
        this.clusterViewListenerService = new ClusterViewListenerService(this);
    }

    /**
     * Creates a new client object and automatically connects to cluster.
     * @param config Default {@link ClientConfig} is used when this parameter is absent.
     * @returns a new client instance
     */
    public static newHazelcastClient(config?: ClientConfig): Promise<HazelcastClient> {
        const configBuilder = new ConfigBuilder(config);
        const effectiveConfig = configBuilder.build();
        const client = new HazelcastClient(effectiveConfig);
        return client.init();
    }

    /**
     * Returns the name of this Hazelcast instance.
     *
     * @return name of this Hazelcast instance
     */
    getName(): string {
        return this.instanceName;
    }

    /**
     * Gathers information of this local client.
     * @returns {ClientInfo}
     */
    getLocalEndpoint(): ClientInfo {
        return this.clusterService.getLocalClient();
    }

    /**
     * Gives all known distributed objects in cluster.
     * @returns {Promise<DistributedObject[]>|Promise<T>}
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

                const newDistributedObjectInfos = ClientGetDistributedObjectsCodec.decodeResponse(responseMessage).response;
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
     * Returns the distributed map instance with given name.
     * @param name
     * @returns {Promise<IMap<K, V>>}
     */
    getMap<K, V>(name: string): Promise<IMap<K, V>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.MAP_SERVICE) as Promise<IMap<K, V>>;
    }

    /**
     * Returns the distributed set instance with given name.
     * @param name
     * @returns {Promise<ISet<E>>}
     */
    getSet<E>(name: string): Promise<ISet<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.SET_SERVICE) as Promise<ISet<E>>;
    }

    /**
     * Returns the distributed queue instance with given name.
     * @param name
     * @returns {Promise<IQueue<E>>}
     */
    getQueue<E>(name: string): Promise<IQueue<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.QUEUE_SERVICE) as Promise<IQueue<E>>;
    }

    /**
     * Returns the distributed list instance with given name.
     * @param name
     * @returns {Promise<IList<E>>}
     */
    getList<E>(name: string): Promise<IList<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.LIST_SERVICE) as Promise<IList<E>>;
    }

    /**
     * Returns the distributed multi-map instance with given name.
     * @param name
     * @returns {Promise<MultiMap<K, V>>}
     */
    getMultiMap<K, V>(name: string): Promise<MultiMap<K, V>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.MULTIMAP_SERVICE) as Promise<MultiMap<K, V>>;
    }

    /**
     * Returns a distributed ringbuffer instance with the given name.
     * @param name
     * @returns {Promise<Ringbuffer<E>>}
     */
    getRingbuffer<E>(name: string): Promise<Ringbuffer<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.RINGBUFFER_SERVICE) as Promise<Ringbuffer<E>>;
    }

    /**
     * Returns a distributed reliable topic instance with the given name.
     * @param name
     * @returns {Promise<ITopic<E>>}
     */
    getReliableTopic<E>(name: string): Promise<ITopic<E>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.RELIABLETOPIC_SERVICE) as Promise<ITopic<E>>;
    }

    /**
     * Returns the distributed replicated-map instance with given name.
     * @param name
     * @returns {Promise<ReplicatedMap<K, V>>}
     */
    getReplicatedMap<K, V>(name: string): Promise<ReplicatedMap<K, V>> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.REPLICATEDMAP_SERVICE) as Promise<ReplicatedMap<K, V>>;
    }

    /**
     * Returns the distributed flake ID generator instance with given name.
     * @param name
     * @returns {Promise<FlakeIdGenerator>}
     */
    getFlakeIdGenerator(name: string): Promise<FlakeIdGenerator> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.FLAKEID_SERVICE) as Promise<FlakeIdGenerator>;
    }

    /**
     * Returns the distributed PN Counter instance with given name.
     * @param name
     * @returns {Promise<PNCounter>}
     */
    getPNCounter(name: string): Promise<PNCounter> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.PNCOUNTER_SERVICE) as Promise<PNCounter>;
    }

    /**
     * Returns configuration that this instance started with.
     * Returned configuration object should not be modified.
     * @returns {ClientConfigImpl}
     */
    getConfig(): ClientConfigImpl {
        return this.config;
    }

    getSerializationService(): SerializationService {
        return this.serializationService;
    }

    getInvocationService(): InvocationService {
        return this.invocationService;
    }

    getListenerService(): ListenerService {
        return this.listenerService;
    }

    getConnectionManager(): ClientConnectionManager {
        return this.connectionManager;
    }

    getPartitionService(): PartitionService {
        return this.partitionService;
    }

    getProxyManager(): ProxyManager {
        return this.proxyManager;
    }

    getNearCacheManager(): NearCacheManager {
        return this.nearCacheManager;
    }

    getClusterService(): ClusterService {
        return this.clusterService;
    }

    getLifecycleService(): LifecycleService {
        return this.lifecycleService;
    }

    getRepairingTask(): RepairingTask {
        if (this.mapRepairingTask == null) {
            this.mapRepairingTask = new RepairingTask(this);
        }
        return this.mapRepairingTask;
    }

    getLoggingService(): LoggingService {
        return this.loggingService;
    }

    /**
     * Registers a distributed object listener to cluster.
     * @param listenerFunc Callback function will be called with following arguments.
     * <ul>
     *     <li>service name</li>
     *     <li>distributed object name</li>
     *     <li>name of the event that happened: either 'created' or 'destroyed'</li>
     * </ul>
     * @returns registration id of the listener.
     */
    addDistributedObjectListener(distributedObjectListener: DistributedObjectListener): Promise<string> {
        return this.proxyManager.addDistributedObjectListener(distributedObjectListener);
    }

    /**
     * Removes a distributed object listener from cluster.
     * @param listenerId id of the listener to be removed.
     * @returns `true` if registration is removed, `false` otherwise.
     */
    removeDistributedObjectListener(listenerId: string): Promise<boolean> {
        return this.proxyManager.removeDistributedObjectListener(listenerId);
    }

    getLockReferenceIdGenerator(): LockReferenceIdGenerator {
        return this.lockReferenceIdGenerator;
    }

    getErrorFactory(): ClientErrorFactory {
        return this.errorFactory;
    }

    /**
     * Returns the {@link AddressProvider} of the client.
     */
    getAddressProvider(): AddressProvider {
        return this.addressProvider;
    }

    getLoadBalancer(): LoadBalancer {
        return this.loadBalancer;
    }

    doShutdown(): void {
        if (this.mapRepairingTask !== undefined) {
            this.mapRepairingTask.shutdown();
        }
        this.nearCacheManager.destroyAllNearCaches();
        this.proxyManager.destroy();
        this.connectionManager.shutdown();
        this.invocationService.shutdown();
        this.statistics.stop();
    }

    /**
     * Shuts down this client instance.
     */
    shutdown(): void {
        this.getLifecycleService().shutdown();
    }

    onClusterRestart(): void {
        this.getLoggingService().getLogger()
            .info('HazelcastClient', 'Clearing local state of the client, because of a cluster restart');
        this.nearCacheManager.clearAllNearCaches();
        this.clusterService.clearMemberListVersion();
    }

    public sendStateToCluster(): Promise<void> {
        return this.proxyManager.createDistributedObjectsOnCluster();
    }

    private init(): Promise<HazelcastClient> {
        try {
            this.lifecycleService.start();
            const configuredMembershipListeners = this.config.membershipListeners;
            this.clusterService.start(configuredMembershipListeners);
            this.clusterViewListenerService.start();
        } catch (e) {
            this.loggingService.getLogger().error('HazelcastClient', 'Client failed to start', e);
            throw e;
        }

        return this.connectionManager.start()
            .then(() => {
                const connectionStrategyConfig = this.config.connectionStrategy;
                if (!connectionStrategyConfig.asyncStart) {
                    return this.clusterService.waitInitialMemberListFetched()
                        .then(() => this.connectionManager.connectToAllClusterMembers());
                }
            })
            .then(() => {
                this.listenerService.start();
                this.proxyManager.init();
                this.loadBalancer.initLoadBalancer(this.clusterService, this.config);
                this.statistics.start();
                return this.sendStateToCluster();
            })
            .then(() => {
                return this;
            })
            .catch((e) => {
                this.loggingService.getLogger().error('HazelcastClient', 'Client failed to start', e);
                throw e;
            });
    }

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

    private createAddressProvider(): AddressProvider {
        const networkConfig = this.getConfig().network;

        const addressListProvided = networkConfig.clusterMembers.length !== 0;
        const hazelcastCloudEnabled = networkConfig.hazelcastCloud.enabled;
        if (addressListProvided && hazelcastCloudEnabled) {
            throw new IllegalStateError('Only one discovery method can be enabled at a time. '
                + 'Cluster members given explicitly: ' + addressListProvided
                + ', hazelcast.cloud enabled: ' + hazelcastCloudEnabled);
        }

        const cloudAddressProvider = this.initCloudAddressProvider();
        if (cloudAddressProvider != null) {
            return cloudAddressProvider;
        }

        return new DefaultAddressProvider(networkConfig);
    }

    private initCloudAddressProvider(): HazelcastCloudAddressProvider {
        const cloudConfig = this.getConfig().network.hazelcastCloud;
        if (cloudConfig.enabled) {
            const discoveryToken = cloudConfig.discoveryToken;
            const urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(this.getConfig().properties, discoveryToken);
            return new HazelcastCloudAddressProvider(urlEndpoint, this.getConnectionTimeoutMillis(),
                this.loggingService.getLogger());
        }
        return null;
    }

    private getConnectionTimeoutMillis(): number {
        const networkConfig = this.getConfig().network;
        const connTimeout = networkConfig.connectionTimeout;
        return connTimeout === 0 ? Number.MAX_VALUE : connTimeout;
    }
}
