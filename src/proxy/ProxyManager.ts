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
import {ReplicatedMapProxy} from './ReplicatedMapProxy';
import {NearCachedMapProxy} from './NearCachedMapProxy';
import {SemaphoreProxy} from './SemaphoreProxy';
import {AtomicLongProxy} from './AtomicLongProxy';
import {LoggingService} from '../logging/LoggingService';
import Address = require('../Address');
import {Invocation} from '../invocation/InvocationService';
import {Member} from '../core/Member';

class ProxyManager {
    public MAP_SERVICE: string = 'hz:impl:mapService';
    public SET_SERVICE: string = 'hz:impl:setService';
    public LOCK_SERVICE: string = 'hz:impl:lockService';
    public QUEUE_SERVICE: string = 'hz:impl:queueService';
    public LIST_SERVICE: string = 'hz:impl:listService';
    public MULTIMAP_SERVICE: string = 'hz:impl:multiMapService';
    public RINGBUFFER_SERVICE: string = 'hz:impl:ringbufferService';
    public REPLICATEDMAP_SERVICE: string = 'hz:impl:replicatedMapService';
    public SEMAPHORE_SERVICE: string = 'hz:impl:semaphoreService';
    public ATOMICLONG_SERVICE: string = 'hz:impl:atomicLongService';

    public service: any = {
        'hz:impl:mapService': MapProxy,
        'hz:impl:setService': SetProxy,
        'hz:impl:queueService': QueueProxy,
        'hz:impl:listService': ListProxy,
        'hz:impl:lockService': LockProxy,
        'hz:impl:multiMapService': MultiMapProxy,
        'hz:impl:ringbufferService': RingbufferProxy,
        'hz:impl:replicatedMapService': ReplicatedMapProxy,
        'hz:impl:semaphoreService': SemaphoreProxy,
        'hz:impl:atomicLongService': AtomicLongProxy
    };

    private proxies: { [proxyName: string]: DistributedObject; } = {};
    private client: HazelcastClient;
    private logger = LoggingService.getLoggingService();
    private readonly invocationTimeoutMillis: number;
    private readonly invocationRetryPauseMillis: number;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.invocationTimeoutMillis = this.client.getInvocationService().getInvocationTimeoutMillis();
        this.invocationRetryPauseMillis = this.client.getInvocationService().getInvocationRetryPauseMillis();
    }

    public getOrCreateProxy(name: string, serviceName: string, createAtServer = true): DistributedObject {
        if (this.proxies[name]) {
            return this.proxies[name];
        } else {
            var newProxy: DistributedObject;
            if (serviceName === this.MAP_SERVICE && this.client.getConfig().nearCacheConfigs[name]) {
                newProxy = new NearCachedMapProxy(this.client, serviceName, name);
            } else {
                newProxy = new this.service[serviceName](this.client, serviceName, name);
            }
            if (createAtServer) {
                this.createProxy(newProxy);
            }
            this.proxies[name] = newProxy;
            return newProxy;
        }
    }

    private createProxy(proxyObject: DistributedObject): Promise<ClientMessage> {
        var promise = Promise.defer<ClientMessage>();

        this.initializeProxy(proxyObject, promise, Date.now() + this.invocationTimeoutMillis);

        return promise.promise;
    }

    private findNextAddress(): Address {
        var members = this.client.getClusterService().getMembers();
        var liteMember: Member = null;
        for (var i = 0; i < members.length; i++) {
            var currentMember = members[i];
            if (currentMember != null && currentMember.isLiteMember === false) {
                return currentMember.address;
            } else if (currentMember != null && currentMember.isLiteMember) {
                liteMember = currentMember;
            }
        }

        if (liteMember != null) {
            return liteMember.address;
        } else {
            return null;
        }
    }

    private initializeProxy(proxyObject: DistributedObject, promise: Promise.Resolver<ClientMessage>, deadline: number): void {
        if (Date.now() <= deadline) {
            var address: Address = this.findNextAddress();
            var request = ClientCreateProxyCodec.encodeRequest(proxyObject.getName(), proxyObject.getServiceName(), address);
            var invocation = new Invocation(this.client, request);
            invocation.address = address;
            this.client.getInvocationService().invoke(invocation).then((response) => {
                promise.resolve(response);
            }).catch((error) => {
                this.logger.warn('ProxyManager', 'Create proxy request for ' + proxyObject.getName() +
                    ' failed. Retrying in ' + this.invocationRetryPauseMillis + 'ms.');
                setTimeout(this.initializeProxy.bind(this, proxyObject, promise, deadline), this.invocationRetryPauseMillis);
            });
        } else {
            promise.reject('Create proxy request timed-out for ' + proxyObject.getName());
        }
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
            ClientAddDistributedObjectListenerCodec.encodeRequest(this.client.getListenerService().isLocalOnlyListener()),
            handler,
            ClientAddDistributedObjectListenerCodec.decodeResponse
        );
    }

    removeDistributedObjectListener(listenerId: string) {
        let encodeFunc = (serverKey: string) => {
            return ClientRemoveDistributedObjectListenerCodec.encodeRequest(serverKey);
        };
        return this.client.getListenerService().deregisterListener(encodeFunc, listenerId);
    }
}
export = ProxyManager;
