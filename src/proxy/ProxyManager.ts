import * as Q from 'q';
import {DistributedObject} from '../DistributedObject';
import {Map} from './Map';
import {Set} from './Set';
import {BaseProxy} from './BaseProxy';
import {ClientCreateProxyCodec} from '../codec/ClientCreateProxyCodec';
import ClientConnection = require('../invocation/ClientConnection');
import ClientMessage = require('../ClientMessage');
import {ClientDestroyProxyCodec} from '../codec/ClientDestroyProxyCodec';
import defer = Q.defer;
import {ClientAddDistributedObjectListenerCodec} from '../codec/ClientAddDistributedObjectListenerCodec';
import {ClientRemoveDistributedObjectListenerCodec} from '../codec/ClientRemoveDistributedObjectListenerCodec';
import HazelcastClient from '../HazelcastClient';
import {Queue} from './Queue';
import {List} from './List';

class ProxyManager {
    public MAP_SERVICE: string = 'hz:impl:mapService';
    public SET_SERVICE: string = 'hz:impl:setService';
    public QUEUE_SERVICE: string = 'hz:impl:queueService';
    public LIST_SERVICE: string = 'hz:impl:listService';

    public service: any = {
        'hz:impl:mapService': Map,
        'hz:impl:setService': Set,
        'hz:impl:queueService': Queue,
        'hz:impl:listService': List
    };

    private proxies: { [proxyName: string]: DistributedObject; } = {};
    private client: HazelcastClient;

    constructor(client: HazelcastClient) {
        this.client = client;
    }

    public getOrCreateProxy(name: string, serviceName: string, createAtServer = true): DistributedObject {
        if (this.proxies.hasOwnProperty(name)) {
            return this.proxies[name];
        } else {
            var newProxy: DistributedObject = new this.service[serviceName](this.client, serviceName, name);
            if (createAtServer) {
                this.createProxy(name, serviceName);
            }
            this.proxies[name] = newProxy;
            return newProxy;
        }
    }

    private createProxy(name: string, serviceName: string): Q.Promise<ClientMessage> {
        var connection: ClientConnection = this.client.getClusterService().getOwnerConnection();
        var request = ClientCreateProxyCodec.encodeRequest(name, serviceName, connection.getAddress());

        var createProxyPromise: Q.Promise<ClientMessage> = this.client.getInvocationService()
            .invokeOnConnection(connection, request);
        return createProxyPromise;
    }

    destroyProxy(name: string, serviceName: string): Q.Promise<void> {
        var deferred = Q.defer<void>();
        delete this.proxies[name];
        var clientMessage = ClientDestroyProxyCodec.encodeRequest(name, serviceName);
        clientMessage.setPartitionId(-1);
        this.client.getInvocationService().invokeOnRandomTarget(clientMessage).then(function () {
            deferred.resolve();
        });
        return deferred.promise;
    }

    addDistributedObjectListener(listenerFunc: Function): Q.Promise<string> {
        var handler = function (clientMessage: ClientMessage) {
            var converterFunc = function (name: string, serviceName: string, eventType: string) {
                if (eventType === 'CREATED') {
                    listenerFunc(name, serviceName, 'created');
                } else if (eventType === 'DESTROYED') {
                    listenerFunc(name, serviceName, 'destroyed');
                }
            };
            ClientAddDistributedObjectListenerCodec.handle(clientMessage, converterFunc, null);
        };
        return this.client.getListenerService().registerListener(
            ClientAddDistributedObjectListenerCodec.encodeRequest(true),
            handler,
            ClientAddDistributedObjectListenerCodec.decodeResponse
        );
    }

    removeDistributedObjectListener(listenerId: string) {
        return this.client.getListenerService().deregisterListener(
            ClientRemoveDistributedObjectListenerCodec.encodeRequest(listenerId),
            ClientRemoveDistributedObjectListenerCodec.decodeResponse
        );
    }
}
export = ProxyManager;
