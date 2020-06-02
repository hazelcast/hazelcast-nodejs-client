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
import {ClientAddDistributedObjectListenerCodec} from '../codec/ClientAddDistributedObjectListenerCodec';
import {ClientCreateProxyCodec} from '../codec/ClientCreateProxyCodec';
import {ClientDestroyProxyCodec} from '../codec/ClientDestroyProxyCodec';
import {ClientRemoveDistributedObjectListenerCodec} from '../codec/ClientRemoveDistributedObjectListenerCodec';
import {DistributedObject} from '../DistributedObject';
import HazelcastClient from '../HazelcastClient';
import {ClientNotActiveError, HazelcastError} from '../HazelcastError';
import {Invocation} from '../invocation/InvocationService';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {FlakeIdGeneratorProxy} from './FlakeIdGeneratorProxy';
import {ListProxy} from './ListProxy';
import {MapProxy} from './MapProxy';
import {MultiMapProxy} from './MultiMapProxy';
import {NearCachedMapProxy} from './NearCachedMapProxy';
import {PNCounterProxy} from './PNCounterProxy';
import {QueueProxy} from './QueueProxy';
import {ReplicatedMapProxy} from './ReplicatedMapProxy';
import {RingbufferProxy} from './ringbuffer/RingbufferProxy';
import {SetProxy} from './SetProxy';
import {ReliableTopicProxy} from './topic/ReliableTopicProxy';
import {DistributedObjectEvent, DistributedObjectListener} from '../core/DistributedObjectListener';
import {DeferredPromise} from '../Util';
import {ILogger} from '../logging/ILogger';
import {ClientMessage} from '../ClientMessage';
import {UUID} from '../core/UUID';
import {ClientCreateProxiesCodec} from '../codec/ClientCreateProxiesCodec';
import {BaseProxy} from './BaseProxy';

export class ProxyManager {
    public static readonly MAP_SERVICE: string = 'hz:impl:mapService';
    public static readonly SET_SERVICE: string = 'hz:impl:setService';
    public static readonly LOCK_SERVICE: string = 'hz:impl:lockService';
    public static readonly QUEUE_SERVICE: string = 'hz:impl:queueService';
    public static readonly LIST_SERVICE: string = 'hz:impl:listService';
    public static readonly MULTIMAP_SERVICE: string = 'hz:impl:multiMapService';
    public static readonly RINGBUFFER_SERVICE: string = 'hz:impl:ringbufferService';
    public static readonly REPLICATEDMAP_SERVICE: string = 'hz:impl:replicatedMapService';
    public static readonly FLAKEID_SERVICE: string = 'hz:impl:flakeIdGeneratorService';
    public static readonly PNCOUNTER_SERVICE: string = 'hz:impl:PNCounterService';
    public static readonly RELIABLETOPIC_SERVICE: string = 'hz:impl:reliableTopicService';

    public readonly service: { [serviceName: string]: any } = {};
    private readonly proxies = new Map<string, Promise<DistributedObject>>();
    private readonly client: HazelcastClient;
    private readonly logger: ILogger;
    private readonly invocationTimeoutMillis: number;
    private readonly invocationRetryPauseMillis: number;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.logger = this.client.getLoggingService().getLogger();
        this.invocationTimeoutMillis = this.client.getInvocationService().getInvocationTimeoutMillis();
        this.invocationRetryPauseMillis = this.client.getInvocationService().getInvocationRetryPauseMillis();
    }

    public init(): void {
        this.service[ProxyManager.MAP_SERVICE] = MapProxy;
        this.service[ProxyManager.SET_SERVICE] = SetProxy;
        this.service[ProxyManager.QUEUE_SERVICE] = QueueProxy;
        this.service[ProxyManager.LIST_SERVICE] = ListProxy;
        this.service[ProxyManager.MULTIMAP_SERVICE] = MultiMapProxy;
        this.service[ProxyManager.RINGBUFFER_SERVICE] = RingbufferProxy;
        this.service[ProxyManager.REPLICATEDMAP_SERVICE] = ReplicatedMapProxy;
        this.service[ProxyManager.FLAKEID_SERVICE] = FlakeIdGeneratorProxy;
        this.service[ProxyManager.PNCOUNTER_SERVICE] = PNCounterProxy;
        this.service[ProxyManager.RELIABLETOPIC_SERVICE] = ReliableTopicProxy;
    }

    public getOrCreateProxy(name: string, serviceName: string, createAtServer = true): Promise<DistributedObject> {
        const fullName = serviceName + name;
        if (this.proxies.has(fullName)) {
            return this.proxies.get(fullName);
        }

        const deferred = DeferredPromise<DistributedObject>();
        this.proxies.set(fullName, deferred.promise);
        let newProxy: DistributedObject;
        if (serviceName === ProxyManager.MAP_SERVICE && this.client.getConfig().getNearCacheConfig(name)) {
            newProxy = new NearCachedMapProxy(this.client, serviceName, name);
        } else if (serviceName === ProxyManager.RELIABLETOPIC_SERVICE) {
            newProxy = new ReliableTopicProxy(this.client, serviceName, name);
            if (createAtServer) {
                (newProxy as ReliableTopicProxy<any>).setRingbuffer().then(() => {
                    return this.createProxy(newProxy);
                }).then(function (): void {
                    deferred.resolve(newProxy);
                }).catch((error) => {
                    this.proxies.delete(fullName);
                    deferred.reject(error);
                });
            } else {
                deferred.resolve(newProxy);
            }
            return deferred.promise;
        } else {
            newProxy = new this.service[serviceName](this.client, serviceName, name);
        }

        if (createAtServer) {
            this.createProxy(newProxy).then(function (): void {
                deferred.resolve(newProxy);
            }).catch((error) => {
                this.proxies.delete(fullName);
                deferred.reject(error);
            });
        } else {
            deferred.resolve(newProxy);
        }

        return deferred.promise;
    }

    public createDistributedObjectsOnCluster(): Promise<void> {
        const proxyEntries = new Array<[string, string]>();
        for (const namespace of Array.from(this.proxies.keys())) {
            const promise = this.proxies.get(namespace);
            if (promise.isFulfilled()) {
                const proxy = promise.value();
                proxyEntries.push([proxy.getName(), proxy.getServiceName()]);
            }
        }
        if (proxyEntries.length === 0) {
            return Promise.resolve();
        }
        const request = ClientCreateProxiesCodec.encodeRequest(proxyEntries);
        request.setPartitionId(-1);
        const invocation = new Invocation(this.client, request);
        return this.client.getInvocationService()
            .invokeUrgent(invocation)
            .return();
    }

    public getDistributedObjects(): Promise<DistributedObject[]> {
        const promises = new Array<Promise<DistributedObject>>();
        Array.from(this.proxies.values()).forEach((proxy) => {
            promises.push(proxy);
        });
        return Promise.all(promises);
    }

    public destroyProxy(name: string, serviceName: string): Promise<void> {
        this.proxies.delete(serviceName + name);
        const clientMessage = ClientDestroyProxyCodec.encodeRequest(name, serviceName);
        clientMessage.setPartitionId(-1);
        return this.client.getInvocationService().invokeOnRandomTarget(clientMessage)
            .return();
    }

    public destroyProxyLocally(namespace: string): Promise<void> {
        const proxy = this.proxies.get(namespace);
        if (proxy != null) {
            this.proxies.delete(namespace);
            return proxy.then((distributedObject) => {
                return (distributedObject as BaseProxy).destroyLocally();
            });
        }
        return Promise.resolve();
    }

    public addDistributedObjectListener(distributedObjectListener: DistributedObjectListener): Promise<string> {
        const handler = function (clientMessage: ClientMessage): void {
            const converterFunc = (objectName: string, serviceName: string, eventType: string) => {
                eventType = eventType.toLowerCase();
                const distributedObjectEvent = new DistributedObjectEvent(eventType, serviceName, objectName);
                distributedObjectListener(distributedObjectEvent);
            };
            ClientAddDistributedObjectListenerCodec.handle(clientMessage, converterFunc);
        };
        const codec = this.createDistributedObjectListener();
        return this.client.getListenerService().registerListener(codec, handler);
    }

    public removeDistributedObjectListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(listenerId);
    }

    public destroy(): void {
        this.proxies.clear();
    }

    private createProxy(proxyObject: DistributedObject): Promise<ClientMessage> {
        const request = ClientCreateProxyCodec.encodeRequest(proxyObject.getName(), proxyObject.getServiceName());
        return this.client.getInvocationService().invokeOnRandomTarget(request);
    }

    private createDistributedObjectListener(): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ClientAddDistributedObjectListenerCodec.encodeRequest(localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ClientAddDistributedObjectListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ClientRemoveDistributedObjectListenerCodec.encodeRequest(listenerId);
            },
        };
    }
}
