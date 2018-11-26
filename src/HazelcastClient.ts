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

import * as Promise from 'bluebird';
import {ClientInfo} from './ClientInfo';
import {ClientGetDistributedObjectsCodec} from './codec/ClientGetDistributedObjectsCodec';
import {ClientConfig} from './config/Config';
import {ConfigBuilder} from './config/ConfigBuilder';
import {DistributedObject} from './DistributedObject';
import {Heartbeat} from './HeartbeatService';
import {ClientConnectionManager} from './invocation/ClientConnectionManager';
import {ClusterService} from './invocation/ClusterService';
import {InvocationService} from './invocation/InvocationService';
import {LifecycleEvent, LifecycleService} from './LifecycleService';
import {ListenerService} from './ListenerService';
import {LockReferenceIdGenerator} from './LockReferenceIdGenerator';
import {LoggingService} from './logging/LoggingService';
import {RepairingTask} from './nearcache/RepairingTask';
import {PartitionService} from './PartitionService';
import {ClientErrorFactory} from './protocol/ErrorFactory';
import {FlakeIdGenerator} from './proxy/FlakeIdGenerator';
import {IAtomicLong} from './proxy/IAtomicLong';
import {IList} from './proxy/IList';
import {ILock} from './proxy/ILock';
import {IMap} from './proxy/IMap';
import {IQueue} from './proxy/IQueue';
import {ReplicatedMap} from './proxy/ReplicatedMap';
import {Ringbuffer} from './proxy/Ringbuffer';
import {ISemaphore} from './proxy/ISemaphore';
import {ISet} from './proxy/ISet';
import {MultiMap} from './proxy/MultiMap';
import {PNCounter} from './proxy/PNCounter';
import {ProxyManager} from './proxy/ProxyManager';
import {ITopic} from './proxy/topic/ITopic';
import {SerializationService, SerializationServiceV1} from './serialization/SerializationService';
import {AddressProvider} from './connection/AddressProvider';
import {HazelcastCloudAddressProvider} from './discovery/HazelcastCloudAddressProvider';
import {HazelcastCloudAddressTranslator} from './discovery/HazelcastCloudAddressTranslator';
import {AddressTranslator} from './connection/AddressTranslator';
import {DefaultAddressTranslator} from './connection/DefaultAddressTranslator';
import {DefaultAddressProvider} from './connection/DefaultAddressProvider';
import {HazelcastCloudDiscovery} from './discovery/HazelcastCloudDiscovery';
import {Statistics} from './statistics/Statistics';
import {NearCacheManager} from './nearcache/NearCacheManager';
import {DistributedObjectListener} from './core/DistributedObjectListener';

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
    private readonly heartbeat: Heartbeat;
    private readonly lockReferenceIdGenerator: LockReferenceIdGenerator;
    private readonly errorFactory: ClientErrorFactory;
    private readonly statistics: Statistics;

    private mapRepairingTask: RepairingTask;

    constructor(config?: ClientConfig) {
        if (config) {
            this.config = config;
        }

        if (config.getInstanceName() != null) {
            this.instanceName = config.getInstanceName();
        } else {
            this.instanceName = 'hz.client_' + this.id;
        }

        this.loggingService = new LoggingService(this.config.properties['hazelcast.logging'],
            this.config.properties['hazelcast.logging.level'] as number);
        this.invocationService = new InvocationService(this);
        this.listenerService = new ListenerService(this);
        this.serializationService = new SerializationServiceV1(this.config.serializationConfig);
        this.proxyManager = new ProxyManager(this);
        this.nearCacheManager = new NearCacheManager(this);
        this.partitionService = new PartitionService(this);
        const addressProviders = this.createAddressProviders();
        const addressTranslator = this.createAddressTranslator();
        this.connectionManager = new ClientConnectionManager(this, addressTranslator, addressProviders);
        this.clusterService = new ClusterService(this);
        this.lifecycleService = new LifecycleService(this);
        this.heartbeat = new Heartbeat(this);
        this.lockReferenceIdGenerator = new LockReferenceIdGenerator();
        this.errorFactory = new ClientErrorFactory();
        this.statistics = new Statistics(this);
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
        return this.clusterService.getClientInfo();
    }

    /**
     * Gives all known distributed objects in cluster.
     * @returns {Promise<DistributedObject[]>|Promise<T>}
     */
    getDistributedObjects(): Promise<DistributedObject[]> {
        const clientMessage = ClientGetDistributedObjectsCodec.encodeRequest();
        const toObjectFunc = this.getSerializationService().toObject.bind(this);
        const proxyManager = this.proxyManager;
        return this.invocationService.invokeOnRandomTarget(clientMessage).then(function (resp): any {
            const response = ClientGetDistributedObjectsCodec.decodeResponse(resp, toObjectFunc).response;
            return response.map((objectInfo: { [key: string]: any }) => {
                return proxyManager.getOrCreateProxy(objectInfo.value, objectInfo.key, false).value();
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
     * Returns the distributed lock instance with given name.
     * @param name
     * @returns {Promise<ILock>}
     */
    getLock(name: string): Promise<ILock> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.LOCK_SERVICE) as Promise<ILock>;
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
     * Returns the distributed atomic long instance with given name.
     * @param name
     * @returns {Promise<IAtomicLong>}
     */
    getAtomicLong(name: string): Promise<IAtomicLong> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.ATOMICLONG_SERVICE) as Promise<IAtomicLong>;
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
     * Returns the distributed semaphore instance with given name.
     * @param name
     * @returns {Promise<ISemaphore>}
     */
    getSemaphore(name: string): Promise<ISemaphore> {
        return this.proxyManager.getOrCreateProxy(name, ProxyManager.SEMAPHORE_SERVICE) as Promise<ISemaphore>;
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

    getHeartbeat(): Heartbeat {
        return this.heartbeat;
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
     * Shuts down this client instance.
     */
    shutdown(): void {
        if (this.mapRepairingTask !== undefined) {
            this.mapRepairingTask.shutdown();
        }
        this.nearCacheManager.destroyAllNearCaches();
        this.statistics.stop();
        this.partitionService.shutdown();
        this.lifecycleService.emitLifecycleEvent(LifecycleEvent.shuttingDown);
        this.heartbeat.cancel();
        this.connectionManager.shutdown();
        this.listenerService.shutdown();
        this.invocationService.shutdown();
        this.lifecycleService.emitLifecycleEvent(LifecycleEvent.shutdown);
    }

    private init(): Promise<HazelcastClient> {
        return this.clusterService.start().then(() => {
            return this.partitionService.initialize();
        }).then(() => {
            return this.heartbeat.start();
        }).then(() => {
            this.lifecycleService.emitLifecycleEvent(LifecycleEvent.started);
        }).then(() => {
            this.proxyManager.init();
            this.listenerService.start();
            this.statistics.start();
            this.loggingService.getLogger().info('HazelcastClient', 'Client started');
            return this;
        }).catch((e) => {
            this.loggingService.getLogger().error('HazelcastClient', 'Client failed to start', e);
            throw e;
        });
    }

    private createAddressTranslator(): AddressTranslator {
        const cloudConfig = this.getConfig().networkConfig.cloudConfig;
        if (cloudConfig.enabled) {
            const urlEndpoint = HazelcastCloudDiscovery.createUrlEndpoint(this.getConfig().properties,
                cloudConfig.discoveryToken);
            return new HazelcastCloudAddressTranslator(urlEndpoint, this.getConnectionTimeoutMillis(),
                this.loggingService.getLogger());
        }
        return new DefaultAddressTranslator();

    }

    private createAddressProviders(): AddressProvider[] {
        const networkConfig = this.getConfig().networkConfig;
        const addressProviders: AddressProvider[] = [];

        const cloudAddressProvider = this.initCloudAddressProvider();
        if (cloudAddressProvider != null) {
            addressProviders.push(cloudAddressProvider);
        }

        addressProviders.push(new DefaultAddressProvider(networkConfig, addressProviders.length === 0));
        return addressProviders;
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
