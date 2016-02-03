import {SerializationService} from './serialization/SerializationService';
import InvocationService = require('./invocation/InvocationService');
import ClientConnectionManager = require('./invocation/ClientConnectionManager');
import {ClientConfig} from './Config';
import ProxyManager = require('./proxy/ProxyManager');
import Q = require('q');
import {IMap} from './IMap';
import {JsonSerializationService} from './serialization/SerializationService';

class HazelcastClient {
    private config: ClientConfig;
    private serializationService: SerializationService;
    private invocationService: InvocationService;
    private connectionManager: ClientConnectionManager;
    private proxyManager: ProxyManager;

    public static newHazelcastClient(config?: ClientConfig): Q.Promise<HazelcastClient> {
        var client: HazelcastClient = new HazelcastClient(config);
        var clientPromise: Q.Promise<HazelcastClient> = client.init();
        return clientPromise;
    }

    constructor(config?: ClientConfig) {
        if (!config) {
            this.config = new ClientConfig();
        }
        this.invocationService = new InvocationService(this);
        this.serializationService = new JsonSerializationService();
        this.proxyManager = new ProxyManager(this);
        this.connectionManager = new ClientConnectionManager(this.config.networkConfig,
            this.config.groupConfig, this.invocationService);
    }

    private init(): Q.Promise<HazelcastClient> {
        var deferred = Q.defer<HazelcastClient>();

        Q.all([
            this.connectionManager.start()
        ]).then(() => {
            deferred.resolve(this);
        }).catch(() => {
            deferred.reject('Client failed to start');
        });

        return deferred.promise;
    }

    public getMap<K, V>(name: string): IMap<K, V> {
        return <IMap<K, V>>this.proxyManager.getOrCreateProxy(name, this.proxyManager.MAP_SERVICE);
    }

    public getSerializationService(): SerializationService {
        return this.serializationService;
    }

    public getInvocationService(): InvocationService {
        return this.invocationService;
    }

    public getConnectionManager(): ClientConnectionManager {
        return this.connectionManager;
    }
}
export = HazelcastClient;
