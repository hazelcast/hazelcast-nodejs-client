/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore *//** */

import {ClientAddDistributedObjectListenerCodec} from '../codec/ClientAddDistributedObjectListenerCodec';
import {ClientCreateProxyCodec} from '../codec/ClientCreateProxyCodec';
import {ClientDestroyProxyCodec} from '../codec/ClientDestroyProxyCodec';
import {ClientRemoveDistributedObjectListenerCodec} from '../codec/ClientRemoveDistributedObjectListenerCodec';
import {DistributedObject} from '../core/DistributedObject';
import {Invocation, InvocationService} from '../invocation/InvocationService';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {FlakeIdGeneratorProxy} from './flakeid/FlakeIdGeneratorProxy';
import {ListProxy} from './ListProxy';
import {MapProxy} from './MapProxy';
import {MultiMapProxy} from './MultiMapProxy';
import {PNCounterProxy} from './PNCounterProxy';
import {QueueProxy} from './QueueProxy';
import {ReplicatedMapProxy} from './ReplicatedMapProxy';
import {RingbufferProxy} from './ringbuffer/RingbufferProxy';
import {SetProxy} from './SetProxy';
import {ReliableTopicProxy} from './topic/ReliableTopicProxy';
import {DistributedObjectEvent, DistributedObjectListener} from '../core/DistributedObjectListener';
import {deferredPromise} from '../util/Util';
import {ClientMessage} from '../protocol/ClientMessage';
import {UUID} from '../core/UUID';
import {ClientCreateProxiesCodec} from '../codec/ClientCreateProxiesCodec';
import {BaseProxy} from './BaseProxy';
import {Ringbuffer} from './Ringbuffer';
import {ClientConfig, ClientConfigImpl} from '../config/Config';
import {ListenerService} from '../listener/ListenerService';
import {NearCachedMapProxy} from './NearCachedMapProxy';
import {ILogger} from '../logging';
import {PartitionService} from '../PartitionService';
import {SerializationService} from '../serialization/SerializationService';
import {ConnectionRegistry} from '../network/ConnectionManager';
import {NearCacheManager} from '../nearcache/NearCacheManager';
import {RepairingTask} from '../nearcache/RepairingTask';
import {ClusterService} from '../invocation/ClusterService';
import {LockReferenceIdGenerator} from './LockReferenceIdGenerator';

/** @internal */
export const NAMESPACE_SEPARATOR = '/';
const RINGBUFFER_PREFIX = '_hz_rb_';

/** @internal */
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

    constructor(
        private readonly clientConfig: ClientConfig,
        private readonly logger: ILogger,
        private readonly invocationService: InvocationService,
        private readonly listenerService: ListenerService,
        private readonly partitionService: PartitionService,
        private readonly serializationService: SerializationService,
        private readonly nearCacheManager: NearCacheManager,
        private readonly getRepairingTask: () => RepairingTask,
        private readonly clusterService: ClusterService,
        private readonly lockReferenceIdGenerator: LockReferenceIdGenerator,
        private readonly connectionRegistry: ConnectionRegistry
    ) {}

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
        const fullName = serviceName + NAMESPACE_SEPARATOR + name;
        if (this.proxies.has(fullName)) {
            return this.proxies.get(fullName);
        }

        const deferred = deferredPromise<DistributedObject>();
        this.proxies.set(fullName, deferred.promise);

        let createProxyPromise: Promise<any>;
        if (createAtServer) {
            createProxyPromise = this.createProxy(name, serviceName);
        } else {
            createProxyPromise = Promise.resolve();
        }

        createProxyPromise
            .then(() => {
                return this.initializeLocalProxy(name, serviceName, createAtServer);
            })
            .then((localProxy) => {
                deferred.resolve(localProxy);
            })
            .catch((error) => {
                this.proxies.delete(fullName);
                deferred.reject(error);
            });

        return deferred.promise;
    }

    public createDistributedObjectsOnCluster(): Promise<void> {
        const proxyEntries = new Array<[string, string]>(this.proxies.size);
        let index = 0;
        this.proxies.forEach((_, namespace) => {
            const separatorIndex = namespace.indexOf(NAMESPACE_SEPARATOR);
            const serviceName = namespace.substring(0, separatorIndex);
            const name = namespace.substring(separatorIndex + 1);
            proxyEntries[index++] = [name, serviceName];
        });
        if (proxyEntries.length === 0) {
            return Promise.resolve();
        }
        const request = ClientCreateProxiesCodec.encodeRequest(proxyEntries);
        request.setPartitionId(-1);
        const invocation = new Invocation(this.invocationService, request);
        return this.invocationService.invokeUrgent(invocation).then(() => {});
    }

    public getDistributedObjects(): Promise<DistributedObject[]> {
        const promises = new Array<Promise<DistributedObject>>(this.proxies.size);
        let index = 0;
        this.proxies.forEach((proxy) => {
            promises[index++] = proxy;
        });
        return Promise.all(promises);
    }

    public destroyProxy(name: string, serviceName: string): Promise<void> {
        this.proxies.delete(serviceName + NAMESPACE_SEPARATOR + name);
        const clientMessage = ClientDestroyProxyCodec.encodeRequest(name, serviceName);
        clientMessage.setPartitionId(-1);
        return this.invocationService.invokeOnRandomTarget(clientMessage).then(() => {});
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
        const handler = (clientMessage: ClientMessage): void => {
            const converterFunc = (objectName: string, serviceName: string, eventType: string): void => {
                eventType = eventType.toLowerCase();
                const distributedObjectEvent = new DistributedObjectEvent(eventType, serviceName, objectName);
                distributedObjectListener(distributedObjectEvent);
            };
            ClientAddDistributedObjectListenerCodec.handle(clientMessage, converterFunc);
        };
        const codec = this.createDistributedObjectListener();
        return this.listenerService.registerListener(codec, handler);
    }

    public removeDistributedObjectListener(listenerId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(listenerId);
    }

    public destroy(): void {
        this.proxies.clear();
    }

    private createProxy(name: string, serviceName: string): Promise<ClientMessage> {
        const request = ClientCreateProxyCodec.encodeRequest(name, serviceName);
        return this.invocationService.invokeOnRandomTarget(request);
    }

    private createDistributedObjectListener(): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ClientAddDistributedObjectListenerCodec.encodeRequest(localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ClientAddDistributedObjectListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ClientRemoveDistributedObjectListenerCodec.encodeRequest(listenerId);
            },
        };
    }

    private initializeLocalProxy(name: string, serviceName: string, createAtServer: boolean): Promise<DistributedObject> {
        let localProxy: DistributedObject;

        const config = this.clientConfig as ClientConfigImpl;
        if (serviceName === ProxyManager.MAP_SERVICE && config.getNearCacheConfig(name)) {
            localProxy = new NearCachedMapProxy(
                serviceName,
                name,
                this.logger,
                this,
                this.partitionService,
                this.invocationService,
                this.serializationService,
                this.nearCacheManager,
                this.getRepairingTask,
                this.listenerService,
                this.clusterService,
                this.connectionRegistry
            );
        } else if (serviceName === ProxyManager.MULTIMAP_SERVICE) {
            localProxy = new MultiMapProxy(
                serviceName,
                name,
                this,
                this.partitionService,
                this.invocationService,
                this.serializationService,
                this.listenerService,
                this.clusterService,
                this.lockReferenceIdGenerator,
                this.connectionRegistry
            );
        } else if (serviceName === ProxyManager.RELIABLETOPIC_SERVICE) {
            localProxy = new ReliableTopicProxy(
                serviceName,
                name,
                this.logger,
                this.clientConfig,
                this,
                this.partitionService,
                this.invocationService,
                this.serializationService,
                this.listenerService,
                this.clusterService,
                this.connectionRegistry
            );
        } else if (serviceName === ProxyManager.FLAKEID_SERVICE) {
            localProxy = new FlakeIdGeneratorProxy(
                serviceName,
                name,
                this.clientConfig,
                this,
                this.partitionService,
                this.invocationService,
                this.serializationService,
                this.listenerService,
                this.clusterService,
                this.connectionRegistry
            );
        } else {
            // This call may throw ClientOfflineError for partition specific proxies with async start
            localProxy = new this.service[serviceName](
                serviceName,
                name,
                this,
                this.partitionService,
                this.invocationService,
                this.serializationService,
                this.listenerService,
                this.clusterService,
                this.connectionRegistry
            );
        }

        if (serviceName === ProxyManager.RELIABLETOPIC_SERVICE) {
            return this.getOrCreateProxy(RINGBUFFER_PREFIX + name, ProxyManager.RINGBUFFER_SERVICE, createAtServer)
                .then((ringbuffer) => {
                    (localProxy as ReliableTopicProxy<any>).setRingbuffer((ringbuffer as Ringbuffer<any>));
                    return localProxy;
                });
        } else {
            return Promise.resolve(localProxy);
        }
    }
}
