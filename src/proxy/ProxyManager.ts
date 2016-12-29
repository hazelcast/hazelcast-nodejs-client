import * as Promise from 'bluebird';
import {DistributedObject} from '../DistributedObject';
import {MapProxy} from './MapProxy';
import {SetProxy} from './SetProxy';
import {ClientCreateProxyCodec} from '../codec/ClientCreateProxyCodec';
import ClientConnection = require('../invocation/ClientConnection');
import ClientMessage = require('../ClientMessage');
import {ClientDestroyProxyCodec} from '../codec/ClientDestroyProxyCodec';
import {ClientAddDistributedObjectListenerCodec} from '../codec/ClientAddDistributedObjectListenerCodec';
import {ClientRemoveDistributedObjectListenerCodec} from '../codec/ClientRemoveDistributedObjectListenerCodec';
import HazelcastClient from '../HazelcastClient';
import {QueueProxy} from './QueueProxy';
import {ListProxy} from './ListProxy';
import {LockProxy} from './LockProxy';
import {MultiMapProxy} from './MultiMapProxy';
import {RingbufferProxy} from './RingbufferProxy';
import {ReplicatedMapProxy} from "./ReplicatedMapProxy";

class ProxyManager {
    public MAP_SERVICE: string = 'hz:impl:mapService';
    public SET_SERVICE: string = 'hz:impl:setService';
    public LOCK_SERVICE: string = 'hz:impl:lockService';
    public QUEUE_SERVICE: string = 'hz:impl:queueService';
    public LIST_SERVICE: string = 'hz:impl:listService';
    public MULTIMAP_SERVICE: string = 'hz:impl:multiMapService';
    public RINGBUFFER_SERVICE: string = 'hz:impl:ringbufferService';
    public REPLICATEDMAP_SERVICE: string = 'hz:impl:replicatedMapService';

    public service: any = {
        'hz:impl:mapService': MapProxy,
        'hz:impl:setService': SetProxy,
        'hz:impl:queueService': QueueProxy,
        'hz:impl:listService': ListProxy,
        'hz:impl:lockService': LockProxy,
        'hz:impl:multiMapService': MultiMapProxy,
        'hz:impl:ringbufferService': RingbufferProxy,
        'hz:impl:replicatedMapService': ReplicatedMapProxy
    };

    private proxies: { [proxyName: string]: DistributedObject; } = {};
    private client: HazelcastClient;

    constructor(client: HazelcastClient) {
        this.client = client;
    }

    public getOrCreateProxy(name: string, serviceName: string, createAtServer = true): DistributedObject {
        if (this.proxies[name]) {
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

    private createProxy(name: string, serviceName: string): Promise<ClientMessage> {
        var connection: ClientConnection = this.client.getClusterService().getOwnerConnection();
        var request = ClientCreateProxyCodec.encodeRequest(name, serviceName, connection.getAddress());

        var createProxyPromise: Promise<ClientMessage> = this.client.getInvocationService()
            .invokeOnConnection(connection, request);
        return createProxyPromise;
    }

    destroyProxy(name: string, serviceName: string): Promise<void> {
        delete this.proxies[name];
        var clientMessage = ClientDestroyProxyCodec.encodeRequest(name, serviceName);
        clientMessage.setPartitionId(-1);
        return this.client.getInvocationService().invokeOnRandomTarget(clientMessage).then(function () {
            return;
        });
    }

    addDistributedObjectListener(listenerFunc: Function): Promise<string> {
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
