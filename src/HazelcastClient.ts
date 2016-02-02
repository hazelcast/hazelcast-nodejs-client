import {SerializationService} from './serialization/SerializationService';
import InvocationService = require('./invocation/InvocationService');
import ClientConnectionManager = require('./invocation/ClientConnectionManager');
import {ClientConfig} from './Config';
import ProxyManager = require('./proxy/ProxyManager');
import Q = require('q');

class HazelcastClient {
    private config: ClientConfig;
    private serializationService: SerializationService;
    private invocationService: InvocationService;
    private connectionManager: ClientConnectionManager;
    private proxyManager: ProxyManager;

    constructor(config?: ClientConfig) {
        if (!config) {
            this.config = new ClientConfig();
        }
        this.invocationService = new InvocationService();
        this.connectionManager = new ClientConnectionManager(this.config.networkConfig,
            this.config.groupConfig, this.invocationService);
    }

    public init(): Q.Promise<void> {
        var deferred = Q.defer<void>();

        Q.all([
            this.connectionManager.start()
        ]).then(() => {
            deferred.resolve();
        }).catch(() => {
            deferred.reject('Client failed to start');
        });

        return deferred.promise;
    }

    public getSerializationService(): SerializationService {
        return this.serializationService;
    }
}
export = HazelcastClient;
