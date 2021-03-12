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

import * as Long from 'long';
import {MapAddNearCacheInvalidationListenerCodec} from '../codec/MapAddNearCacheInvalidationListenerCodec';
import {MapRemoveEntryListenerCodec} from '../codec/MapRemoveEntryListenerCodec';
import {EventType} from './EventType';
import {UUID} from '../core/UUID';
import {PartitionService, PartitionServiceImpl} from '../PartitionService';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {NearCache} from '../nearcache/NearCache';
import {StaleReadDetectorImpl} from '../nearcache/StaleReadDetector';
import {Data} from '../serialization/Data';
import {MapProxy} from './MapProxy';
import {ClientMessage, ClientMessageHandler} from '../protocol/ClientMessage';
import {NearCacheManager} from '../nearcache/NearCacheManager';
import {RepairingTask} from '../nearcache/RepairingTask';
import {ListenerService} from '../listener/ListenerService';
import {ILogger} from '../logging';
import {ProxyManager} from './ProxyManager';
import {InvocationService} from '../invocation/InvocationService';
import {SerializationService} from '../serialization/SerializationService';
import {ConnectionRegistry} from '../network/ConnectionManager';
import {ClusterService} from '../invocation/ClusterService';

/** @internal */
export class NearCachedMapProxy<K, V> extends MapProxy<K, V> {

    private nearCache: NearCache;
    private invalidationListenerId: string;
    private readonly nearCacheManager: NearCacheManager;
    private readonly getRepairingTask: () => RepairingTask;

    constructor(
        servicename: string,
        name: string,
        logger: ILogger,
        proxyManager: ProxyManager,
        partitionService: PartitionService,
        invocationService: InvocationService,
        serializationService: SerializationService,
        nearCacheManager: NearCacheManager,
        getRepairingTask: () => RepairingTask,
        listenerService: ListenerService,
        clusterService: ClusterService,
        connectionRegistry: ConnectionRegistry
    ) {
        super(
            servicename,
            name,
            proxyManager,
            partitionService,
            invocationService,
            serializationService,
            listenerService,
            clusterService,
            connectionRegistry
        );
        this.nearCacheManager = nearCacheManager;
        this.getRepairingTask = getRepairingTask;
        this.nearCache = this.nearCacheManager.getOrCreateNearCache(name);
        if (this.nearCache.isInvalidatedOnChange()) {
            this.addNearCacheInvalidationListener().then((id) => {
                this.invalidationListenerId = id;
                this.nearCache.setReady();
            }).catch((e) => {
                logger.warn('NearCachedMapProxy', 'Failed to register Near Cache invalidation listener for '
                    + name + ' map.', e);
                this.nearCache.setReady(e);
            });
        } else {
            this.nearCache.setReady();
        }
    }

    clear(): Promise<void> {
        return super.clear().then<void>(this.invalidateCacheAndReturn.bind(this));
    }

    evictAll(): Promise<void> {
        this.nearCache.clear();
        return super.evictAll().then<void>(this.invalidateCacheAndReturn.bind(this));
    }

    protected containsKeyInternal(keyData: Data): Promise<boolean> {
        return this.nearCache.get(keyData).then((cachedValue) => {
            if (cachedValue !== undefined) {
                return Promise.resolve(cachedValue != null);
            } else {
                return super.containsKeyInternal(keyData);
            }
        });
    }

    protected deleteInternal(keyData: Data): Promise<void> {
        this.nearCache.invalidate(keyData);
        return super.deleteInternal(keyData)
            .then<void>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected evictInternal(key: Data): Promise<boolean> {
        return super.evictInternal(key)
            .then<boolean>(this.invalidateCacheEntryAndReturn.bind(this, key));
    }

    protected finalizePutAll(partitionsToKeysData: { [id: string]: Array<[Data, Data]> }): void {
        for (const partition in partitionsToKeysData) {
            partitionsToKeysData[partition].forEach((entry) => {
                this.nearCache.invalidate(entry[0]);
            });
        }
    }

    protected postDestroy(): Promise<void> {
        return this.removeNearCacheInvalidationListener().then(() => {
            this.nearCacheManager.destroyNearCache(this.name);
        }).then(() => {
            return super.postDestroy();
        });
    }

    protected putIfAbsentInternal(keyData: Data,
                                  valueData: Data,
                                  ttl: number | Long = -1,
                                  maxIdle?: number | Long): Promise<V> {
        return super.putIfAbsentInternal(keyData, valueData, ttl, maxIdle)
            .then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected putTransientInternal(keyData: Data,
                                   valueData: Data,
                                   ttl: number | Long = -1,
                                   maxIdle?: number | Long): Promise<void> {
        return super.putTransientInternal(keyData, valueData, ttl, maxIdle)
            .then<void>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected executeOnKeyInternal(keyData: Data, proData: Data): Promise<V> {
        return super.executeOnKeyInternal(keyData, proData)
            .then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected putInternal(keyData: Data,
                          valueData: Data,
                          ttl: number | Long = -1,
                          maxIdle?: number | Long): Promise<V> {
        return super.putInternal(keyData, valueData, ttl, maxIdle)
            .then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected getInternal(keyData: Data): Promise<V> {
        return this.nearCache.get(keyData).then((cachedValue) => {
            if (cachedValue !== undefined) {
                return Promise.resolve(cachedValue);
            } else {
                const reservation = this.nearCache.tryReserveForUpdate(keyData);
                return super.getInternal(keyData).then((val: V) => {
                    this.nearCache.tryPublishReserved(keyData, val, reservation);
                    return val;
                }).catch((err: any) => {
                    throw err;
                });
            }
        });
    }

    protected tryRemoveInternal(keyData: Data, timeout: number): Promise<boolean> {
        return super.tryRemoveInternal(keyData, timeout)
            .then<boolean>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected removeInternal(keyData: Data, value: V): Promise<V | boolean> {
        return super.removeInternal(keyData, value)
            .then<V | boolean>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected getAllInternal(partitionsToKeys: { [id: string]: Data[] },
                             result: Array<[any, any]> = []): Promise<any[]> {
        const promises = [];
        try {
            for (const partition in partitionsToKeys) {
                const partitionArray = partitionsToKeys[partition];
                for (let i = partitionArray.length - 1; i >= 0; i--) {
                    const key = partitionArray[i];
                    promises.push(this.nearCache.get(key).then((cachedResult) => {
                        if (cachedResult !== undefined) {
                            result.push([this.toObject(partitionArray[i]), cachedResult]);
                            partitionArray.splice(i, 1);
                        }
                    }));
                }
            }
        } catch (err) {
            return Promise.resolve([]);
        }
        return Promise.all(promises).then(() => {
            const reservations: Long[] = [];
            for (const partition in partitionsToKeys) {
                const partitionArray = partitionsToKeys[partition];
                for (const key of partitionArray) {
                    reservations.push(this.nearCache.tryReserveForUpdate(key));
                }
            }
            return super.getAllInternal(partitionsToKeys, result).then((serializedEntryArray) => {
                serializedEntryArray.forEach((serializedEntry, index) => {
                    const key = serializedEntry[0];
                    const value = serializedEntry[1];
                    this.nearCache.tryPublishReserved(key, value, reservations[index]);
                });
                return result;
            });
        });
    }

    protected replaceIfSameInternal(keyData: Data, oldValueData: Data, newValueData: Data): Promise<boolean> {
        return super.replaceIfSameInternal(keyData, oldValueData, newValueData)
            .then<boolean>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected replaceInternal(keyData: Data, valueData: Data): Promise<V> {
        return super.replaceInternal(keyData, valueData)
            .then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected setInternal(keyData: Data,
                          valueData: Data,
                          ttl: number | Long = -1,
                          maxIdle?: number | Long): Promise<void> {
        return super.setInternal(keyData, valueData, ttl, maxIdle)
            .then<void>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected tryPutInternal(keyData: Data, valueData: Data, timeout: number): Promise<boolean> {
        return super.tryPutInternal(keyData, valueData, timeout)
            .then<boolean>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected setTtlInternal(keyData: Data, ttl: number): Promise<boolean> {
        return super.setTtlInternal(keyData, ttl)
            .then<boolean>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    private removeNearCacheInvalidationListener(): Promise<boolean> {
        this.getRepairingTask().deregisterHandler(this.name);
        return this.listenerService.deregisterListener(this.invalidationListenerId);
    }

    private invalidateCacheEntryAndReturn<T>(keyData: Data, retVal: T): T {
        this.nearCache.invalidate(keyData);
        return retVal;
    }

    private invalidateCacheAndReturn<T>(retVal: T): T {
        this.nearCache.clear();
        return retVal;
    }

    private addNearCacheInvalidationListener(): Promise<string> {
        const codec = this.createInvalidationListenerCodec(this.name, EventType.INVALIDATION);
        return this.createNearCacheEventHandler().then((handler) => {
            return this.listenerService.registerListener(codec, handler);
        });
    }

    private createInvalidationListenerCodec(name: string, flags: number): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddNearCacheInvalidationListenerCodec.encodeRequest(name, flags, localOnly);

            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return MapAddNearCacheInvalidationListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createNearCacheEventHandler(): Promise<ClientMessageHandler> {
        const repairingTask = this.getRepairingTask();
        return repairingTask.registerAndGetHandler(
            this.getName(),
            this.nearCache
        ).then((repairingHandler) => {
            const staleReadDetector = new StaleReadDetectorImpl(
                repairingHandler, this.partitionService as PartitionServiceImpl);
            this.nearCache.setStaleReadDetector(staleReadDetector);

            const handle = (key: Data, sourceUuid: UUID, partitionUuid: UUID, sequence: Long) => {
                repairingHandler.handle(key, sourceUuid, partitionUuid, sequence);
            };
            const handleBatch = (keys: Data[], sourceUuids: UUID[], partititonUuids: UUID[], sequences: Long[]) => {
                repairingHandler.handleBatch(keys, sourceUuids, partititonUuids, sequences);
            };

            return (message: ClientMessage) => {
                MapAddNearCacheInvalidationListenerCodec.handle(message, handle, handleBatch);
            };
        });
    }
}
