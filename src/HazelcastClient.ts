import {SerializationService, SerializationServiceV1} from './serialization/SerializationService';
import {InvocationService, ListenerService} from './invocation/InvocationService';
import {ClientConfig} from './Config';
import * as Q from 'q';
import {IMap} from './IMap';
import {ISet} from './ISet';
import {LoggingService} from './LoggingService';
import {LifecycleService, LifecycleEvent} from './LifecycleService';
import {ClientGetDistributedObjectsCodec} from './codec/ClientGetDistributedObjectsCodec';
import {DistributedObject} from './DistributedObject';
import {ClientInfo} from './ClientInfo';
import ClientConnectionManager = require('./invocation/ClientConnectionManager');
import ProxyManager = require('./proxy/ProxyManager');
import PartitionService = require('./PartitionService');
import ClusterService = require('./invocation/ClusterService');
import Heartbeat = require('./Heartbeat');
import ClientMessage = require('./ClientMessage');
import {IQueue} from './IQueue';

export default class HazelcastClient {

    private config: ClientConfig = new ClientConfig();
    private loggingService: LoggingService;
    private serializationService: SerializationService;
    private invocationService: InvocationService;
    private listenerService: ListenerService;
    private connectionManager: ClientConnectionManager;
    private partitionService: PartitionService;
    private clusterService: ClusterService;
    private lifecycleService: LifecycleService;
    private proxyManager: ProxyManager;
    private heartbeat: Heartbeat;

    /**
     * Creates a new client object and automatically connects to cluster.
     * @param config Default {@link ClientConfig} is used when this parameter is absent.
     * @returns {Q.Promise<HazelcastClient>}
     */
    public static newHazelcastClient(config?: ClientConfig): Q.Promise<HazelcastClient> {
        var client: HazelcastClient = new HazelcastClient(config);
        return client.init();
    }

    constructor(config?: ClientConfig) {
        if (config) {
            this.config = config;
        }

        LoggingService.initialize(this.config.properties['hazelcast.logging']);
        this.loggingService = LoggingService.getLoggingService();
        this.invocationService = new InvocationService(this);
        this.listenerService = new ListenerService(this);
        this.serializationService = new SerializationServiceV1(this.config.serializationConfig);
        this.proxyManager = new ProxyManager(this);
        this.partitionService = new PartitionService(this);
        this.connectionManager = new ClientConnectionManager(this);
        this.clusterService = new ClusterService(this);
        this.lifecycleService = new LifecycleService(this);
        this.heartbeat = new Heartbeat(this);
    }

    private init(): Q.Promise<HazelcastClient> {
        var deferred = Q.defer<HazelcastClient>();
        this.clusterService.start()
            .then(() => {
                return this.partitionService.initialize();
            })
            .then(() => {
                return this.heartbeat.start();
            })
            .then(() => {
                this.lifecycleService.emitLifecycleEvent(LifecycleEvent.started);
                this.loggingService.info('HazelcastClient', 'Client started');
                deferred.resolve(this);
            }).catch((e) => {
            this.loggingService.error('HazelcastClient', 'Client failed to start', e);
            deferred.reject(e);
        });

        return deferred.promise;
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
    getDistributedObjects(): Q.Promise<DistributedObject[]> {
        var deferred = Q.defer<DistributedObject[]>();
        var clientMessage = ClientGetDistributedObjectsCodec.encodeRequest();
        var toObjectFunc = this.serializationService.toObject.bind(this);
        var proxyManager = this.proxyManager;
        this.invocationService.invokeOnRandomTarget(clientMessage).then(function(resp) {
            var objectsInfoList = ClientGetDistributedObjectsCodec.decodeResponse(resp, toObjectFunc).response;
            var proxies: DistributedObject[] = [];
            for (var i = 0; i < objectsInfoList.size(); i++)  {
                var objectInfo = objectsInfoList.get(i);
                proxies.push(proxyManager.getOrCreateProxy(objectInfo[1], objectInfo[0], false));
            }
            deferred.resolve(proxies);
        }).catch(deferred.reject);
        return deferred.promise;
    }

    /**
     * Returns the distributed map instance with given name.
     * @param name
     * @returns {IMap<K, V>}
     */
    getMap<K, V>(name: string): IMap<K, V> {
        return <IMap<K, V>>this.proxyManager.getOrCreateProxy(name, this.proxyManager.MAP_SERVICE);
    }

    /**
     * Returns the distributed set instance with given name.
     * @param name
     * @returns {ISet<K, V>}
     */
    getSet<E>(name: string): ISet<E> {
        return <ISet<E>>this.proxyManager.getOrCreateProxy(name, this.proxyManager.SET_SERVICE);
    }

    /**
     * Returns the distributed queue instance with given name.
     * @param name
     * @returns {IQueue<E>}
     */
    getQueue<E>(name: string): IQueue<E> {
        return <IQueue<E>>this.proxyManager.getOrCreateProxy(name, this.proxyManager.QUEUE_SERVICE);
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

    getClusterService(): ClusterService {
        return this.clusterService;
    }

    getHeartbeat(): Heartbeat {
        return this.heartbeat;
    }

    getLifecycleService(): LifecycleService {
        return this.lifecycleService;
    }

    /**
     * Registers a distributed object listener to cluster.
     * @param listenerFunc Callback function will be called with following arguments.
     * <ul>
     *     <li>service name</li>
     *     <li>distributed object name</li>
     *     <li>name of the event that happened: either 'created' or 'destroyed'</li>
     * </ul>
     * @returns {Q.Promise<string>} registration id of the listener.
     */
    addDistributedObjectListener(listenerFunc: Function): Q.Promise<string> {
        return this.proxyManager.addDistributedObjectListener(listenerFunc);
    }

    /**
     * Removes a distributed object listener from cluster.
     * @param listenerId id of the listener to be removed.
     * @returns {Q.Promise<boolean>} true if registration is removed, false otherwise.
     */
    removeDistributedObjectListener(listenerId: string): Q.Promise<boolean> {
        return this.proxyManager.removeDistributedObjectListener(listenerId);
    }

    /**
     * Shutsdown this client instance.
     */
    shutdown(): void {
        this.lifecycleService.emitLifecycleEvent(LifecycleEvent.shuttingDown);
        this.heartbeat.cancel();
        this.connectionManager.shutdown();
        this.lifecycleService.emitLifecycleEvent(LifecycleEvent.shutdown);
    }
}

