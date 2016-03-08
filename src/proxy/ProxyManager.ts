import Q = require('q');
import HazelcastClient = require('../HazelcastClient');
import {DistributedObject} from '../DistributedObject';
import {Map} from './Map';
import {BaseProxy} from './BaseProxy';
import {ClientCreateProxyCodec} from '../codec/ClientCreateProxyCodec';
import ClientConnection = require('../invocation/ClientConnection');
import ClientMessage = require('../ClientMessage');
import {ClientDestroyProxyCodec} from '../codec/ClientDestroyProxyCodec';
import defer = Q.defer;

class ProxyManager {
    public MAP_SERVICE: string = 'hz:impl:mapService';

    public service: any = {
        'hz:impl:mapService': Map
    };

    private proxies: { [proxyName: string]: DistributedObject; } = {};
    private client: HazelcastClient;


    constructor(client: HazelcastClient) {
        this.client = client;
    }

    public getOrCreateProxy(name: string, serviceName: string): DistributedObject {
        if (this.proxies.hasOwnProperty(name)) {
            return this.proxies[name];
        } else {
            var newProxy: DistributedObject = new this.service[serviceName](this.client, serviceName, name);
            this.createProxy(name, serviceName);
            this.proxies[name] = newProxy;
            return newProxy;
        }
    }

    private createProxy(name: string, serviceName: string): Q.Promise<ClientMessage> {
        var connection: ClientConnection = this.client.getClusterService().getOwnerConnection();
        var request = ClientCreateProxyCodec.encodeRequest(name, serviceName, connection.getAddress());

        var createProxyPromise: Q.Promise<ClientMessage> = this.client.getInvocationService()
            .invokeOnConnection(connection, request);
        createProxyPromise.then((clientMessage: ClientMessage) => {
            ClientCreateProxyCodec.decodeResponse(clientMessage);
        });
        return createProxyPromise;
    }

    destroyProxy(name: string, serviceName: string): Q.Promise<void> {
        var deferred = Q.defer<void>();
        delete this.proxies[name];
        var clientMessage = ClientDestroyProxyCodec.encodeRequest(name, serviceName);
        clientMessage.setPartitionId(-1);
        this.client.getInvocationService().invokeOnRandomTarget(clientMessage).then(function() {
            deferred.resolve();
        });
        return deferred.promise;
    }
}
export = ProxyManager;
