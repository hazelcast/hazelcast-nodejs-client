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
import {ClientConfig} from './config/Config';
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
import {ProxyManager} from './proxy/ProxyManager';
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
import {RoundRobinLB} from './util/RoundRobinLB';
import {ClusterViewListenerService} from './listener/ClusterViewListenerService';

export default class HazelcastClient {
    private static CLIENT_ID = 0;

    private readonly instanceName: string;
    private readonly id: number = HazelcastClient.CLIENT_ID++;
    private readonly config: ClientConfig = new ClientConfig();
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

    constructor(config: ClientConfig) {
        this.config = config;
        if (config.getInstanceName() != null) {
            this.instanceName = config.getInstanceName();
        } else {
            this.instanceName = 'hz.client_' + this.id;
        }

        this.loggingService = new LoggingService(this.config.customLogger,
            this.config.properties['hazelcast.logging.level'] as number);
        this.loadBalancer = this.initLoadBalancer();
        this.listenerService = new ListenerService(this);
        this.serializationService = new SerializationServiceV1(this, this.config.serializationConfig);
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
        if (config == null) {
            const configBuilder = new ConfigBuilder();
            return configBuilder.loadConfig().then(() => {
                const client = new HazelcastClient(configBuilder.build());
                return client.init();
            });
        } else {
            const client = new HazelcastClient(config);
            return client.init();
        }
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
        const proxyManager = this.proxyManager;
        return this.invocationService.invokeOnRandomTarget(clientMessage)
            .then((resp) => {
                const response = ClientGetDistributedObjectsCodec.decodeResponse(resp).response;
                return response.map((objectInfo) => {
                    // TODO value throws if the returned promise from the getOrCreate is not fullfiled yet.
                    //  This needs to be fixed. Also, we should create local instances instead of making remote calls.
                    return proxyManager.getOrCreateProxy(objectInfo.name, objectInfo.serviceName, false).value();
                });
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
     * Return configuration that this instance started with.
     * Returned configuration object should not be modified.
     * @returns {ClientConfig}
     */
    getConfig(): ClientConfig {
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
        this.listenerService.shutdown();
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
            // TODO implement defining membership listeners with JSON config
            const configuredMembershipListeners = this.config.listeners.getMembershipListeners();
            this.clusterService.start(configuredMembershipListeners);
            this.clusterViewListenerService.start();
        } catch (e) {
            this.loggingService.getLogger().error('HazelcastClient', 'Client failed to start', e);
            return Promise.reject(e);
        }

        return this.connectionManager.start()
            .then(() => {
                const connectionStrategyConfig = this.config.connectionStrategyConfig;
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
        let lb = this.config.loadBalancer;
        if (lb == null) {
            lb = new RoundRobinLB();
        }
        return lb;
    }

    private createAddressProvider(): AddressProvider {
        const networkConfig = this.getConfig().networkConfig;

        const addressListProvided = networkConfig.addresses.length !== 0;
        const hazelcastCloudEnabled = networkConfig.cloudConfig.enabled;
        if (addressListProvided && hazelcastCloudEnabled) {
            throw new IllegalStateError('Only one discovery method can be enabled at a time.'
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
        const cloudConfig = this.getConfig().networkConfig.cloudConfig;
        if (cloudConfig.enabled) {
            const discoveryToken = cloudConfig.discoveryToken;
            const urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(this.getConfig().properties, discoveryToken);
            return new HazelcastCloudAddressProvider(urlEndpoint, this.getConnectionTimeoutMillis(),
                this.loggingService.getLogger());
        }
        return null;
    }

    private getConnectionTimeoutMillis(): number {
        const networkConfig = this.getConfig().networkConfig;
        const connTimeout = networkConfig.connectionTimeout;
        return connTimeout === 0 ? Number.MAX_VALUE : connTimeout;
    }
}
