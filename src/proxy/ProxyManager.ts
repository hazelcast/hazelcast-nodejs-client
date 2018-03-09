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
import {DistributedObject} from '../DistributedObject';
import {MapProxy} from './MapProxy';
import {SetProxy} from './SetProxy';
import {ClientCreateProxyCodec} from '../codec/ClientCreateProxyCodec';
import ClientMessage = require('../ClientMessage');
import {ClientDestroyProxyCodec} from '../codec/ClientDestroyProxyCodec';
import {ClientAddDistributedObjectListenerCodec} from '../codec/ClientAddDistributedObjectListenerCodec';
import {ClientRemoveDistributedObjectListenerCodec} from '../codec/ClientRemoveDistributedObjectListenerCodec';
import HazelcastClient from '../HazelcastClient';
import {QueueProxy} from './QueueProxy';
import {ListProxy} from './ListProxy';
import {LockProxy} from './LockProxy';
import {MultiMapProxy} from './MultiMapProxy';
import {RingbufferProxy} from './ringbuffer/RingbufferProxy';
import {ReplicatedMapProxy} from './ReplicatedMapProxy';
import {NearCachedMapProxy} from './NearCachedMapProxy';
import {SemaphoreProxy} from './SemaphoreProxy';
import {AtomicLongProxy} from './AtomicLongProxy';
import {LoggingService} from '../logging/LoggingService';
import Address = require('../Address');
import {Invocation} from '../invocation/InvocationService';
import {Member} from '../core/Member';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {ClientNotActiveError, HazelcastError} from '../HazelcastError';

export class ProxyManager {
    public static readonly MAP_SERVICE: string = 'hz:impl:mapService';
    public static readonly SET_SERVICE: string = 'hz:impl:setService';
    public static readonly LOCK_SERVICE: string = 'hz:impl:lockService';
    public static readonly QUEUE_SERVICE: string = 'hz:impl:queueService';
    public static readonly LIST_SERVICE: string = 'hz:impl:listService';
    public static readonly MULTIMAP_SERVICE: string = 'hz:impl:multiMapService';
    public static readonly RINGBUFFER_SERVICE: string = 'hz:impl:ringbufferService';
    public static readonly REPLICATEDMAP_SERVICE: string = 'hz:impl:replicatedMapService';
    public static readonly SEMAPHORE_SERVICE: string = 'hz:impl:semaphoreService';
    public static readonly ATOMICLONG_SERVICE: string = 'hz:impl:atomicLongService';

    public readonly service: {[serviceName: string]: any} = {};
    private readonly proxies: { [proxyName: string]: DistributedObject; } = {};
    private readonly client: HazelcastClient;
    private readonly logger = LoggingService.getLoggingService();
    private readonly invocationTimeoutMillis: number;
    private readonly invocationRetryPauseMillis: number;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.invocationTimeoutMillis = this.client.getInvocationService().getInvocationTimeoutMillis();
        this.invocationRetryPauseMillis = this.client.getInvocationService().getInvocationRetryPauseMillis();
    }

    public init(): void {
        this.service[ProxyManager.MAP_SERVICE] = MapProxy;
        this.service[ProxyManager.SET_SERVICE] = SetProxy;
        this.service[ProxyManager.QUEUE_SERVICE] = QueueProxy;
        this.service[ProxyManager.LIST_SERVICE] = ListProxy;
        this.service[ProxyManager.LOCK_SERVICE] = LockProxy;
        this.service[ProxyManager.MULTIMAP_SERVICE] = MultiMapProxy;
        this.service[ProxyManager.RINGBUFFER_SERVICE] = RingbufferProxy;
        this.service[ProxyManager.REPLICATEDMAP_SERVICE] = ReplicatedMapProxy;
        this.service[ProxyManager.SEMAPHORE_SERVICE] = SemaphoreProxy;
        this.service[ProxyManager.ATOMICLONG_SERVICE] = AtomicLongProxy;
    }

    public getOrCreateProxy(name: string, serviceName: string, createAtServer = true): DistributedObject {
        if (this.proxies[name]) {
            return this.proxies[name];
        } else {
            let newProxy: DistributedObject;
            if (serviceName === ProxyManager.MAP_SERVICE && this.client.getConfig().nearCacheConfigs[name]) {
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
        let promise = Promise.defer<ClientMessage>();
        this.initializeProxy(proxyObject, promise, Date.now() + this.invocationTimeoutMillis);
        return promise.promise;
    }

    private findNextAddress(): Address {
        let members = this.client.getClusterService().getMembers();
        let liteMember: Member = null;
        for (let i = 0; i < members.length; i++) {
            let currentMember = members[i];
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
            let address: Address = this.findNextAddress();
            let request = ClientCreateProxyCodec.encodeRequest(proxyObject.getName(), proxyObject.getServiceName(), address);
            let invocation = new Invocation(this.client, request);
            invocation.address = address;
            this.client.getInvocationService().invoke(invocation).then((response) => {
                promise.resolve(response);
            }).catch((error) => {
                if (this.isRetryable(error)) {
                    this.logger.warn('ProxyManager', 'Create proxy request for ' + proxyObject.getName() +
                        ' failed. Retrying in ' + this.invocationRetryPauseMillis + 'ms. ' + error);
                    setTimeout(this.initializeProxy.bind(this, proxyObject, promise, deadline), this.invocationRetryPauseMillis);
                } else {
                    this.logger.warn('ProxyManager', 'Create proxy request for ' + proxyObject.getName() + ' failed ' + error);
                }
            });
        } else {
            promise.reject('Create proxy request timed-out for ' + proxyObject.getName());
        }
    }

    protected isRetryable(error: HazelcastError): boolean {
        if (error instanceof ClientNotActiveError) {
            return false;
        }
        return true;
    }

    destroyProxy(name: string, serviceName: string): Promise<void> {
        delete this.proxies[name];
        let clientMessage = ClientDestroyProxyCodec.encodeRequest(name, serviceName);
        clientMessage.setPartitionId(-1);
        return this.client.getInvocationService().invokeOnRandomTarget(clientMessage).return();
    }

    addDistributedObjectListener(listenerFunc: Function): Promise<string> {
        let handler = function (clientMessage: ClientMessage) {
            let converterFunc = function (name: string, serviceName: string, eventType: string) {
                if (eventType === 'CREATED') {
                    listenerFunc(name, serviceName, 'created');
                } else if (eventType === 'DESTROYED') {
                    listenerFunc(name, serviceName, 'destroyed');
                }
            };
            ClientAddDistributedObjectListenerCodec.handle(clientMessage, converterFunc, null);
        };
        let codec = this.createDistributedObjectListener();
        return this.client.getListenerService().registerListener(codec, handler);
    }

    removeDistributedObjectListener(listenerId: string) {
        return this.client.getListenerService().deregisterListener(listenerId);
    }

    private createDistributedObjectListener(): ListenerMessageCodec {
        return {
            encodeAddRequest: function(localOnly: boolean): ClientMessage {
                return ClientAddDistributedObjectListenerCodec.encodeRequest(localOnly);
            },
            decodeAddResponse: function(msg: ClientMessage): string {
                return ClientAddDistributedObjectListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest: function(listenerId: string): ClientMessage {
                return ClientRemoveDistributedObjectListenerCodec.encodeRequest(listenerId);
            }
        };
    }
}
