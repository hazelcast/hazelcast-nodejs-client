/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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
import {MapAddNearCacheEntryListenerCodec} from '../codec/MapAddNearCacheEntryListenerCodec';
import {MapAddNearCacheInvalidationListenerCodec} from '../codec/MapAddNearCacheInvalidationListenerCodec';
import {MapRemoveEntryListenerCodec} from '../codec/MapRemoveEntryListenerCodec';
import {EventType} from '../core/EventType';
import {UUID} from '../core/UUID';
import HazelcastClient from '../HazelcastClient';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {NearCache} from '../nearcache/NearCache';
import {StaleReadDetectorImpl} from '../nearcache/StaleReadDetectorImpl';
import {Data} from '../serialization/Data';
import {MapProxy} from './MapProxy';
import {BuildInfo} from '../BuildInfo';
import ClientMessage = require('../ClientMessage');

export class NearCachedMapProxy<K, V> extends MapProxy<K, V> {

    private nearCache: NearCache;
    private invalidationListenerId: string;

    constructor(client: HazelcastClient, servicename: string, name: string) {
        super(client, servicename, name);

        this.nearCache = this.client.getNearCacheManager().getOrCreateNearCache(name);
        if (this.nearCache.isInvalidatedOnChange()) {
            this.addNearCacheInvalidationListener().then((id: string) => {
                this.invalidationListenerId = id;
                this.nearCache.setReady();
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
        return super.deleteInternal(keyData).then<void>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected evictInternal(key: Data): Promise<boolean> {
        return super.evictInternal(key).then<boolean>(this.invalidateCacheEntryAndReturn.bind(this, key));
    }

    protected putAllInternal(partitionsToKeysData: { [id: string]: Array<[Data, Data]> }): Promise<void> {
        return super.putAllInternal(partitionsToKeysData).then(() => {
            for (const partition in partitionsToKeysData) {
                partitionsToKeysData[partition].forEach((entry: [Data, Data]) => {
                    this.nearCache.invalidate(entry[0]);
                });
            }
        });
    }

    protected postDestroy(): Promise<void> {
        return this.removeNearCacheInvalidationListener().then(() => {
            this.client.getNearCacheManager().destroyNearCache(this.name);
        }).then(() => {
            return super.postDestroy();
        });
    }

    protected putIfAbsentInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return super.putIfAbsentInternal(keyData, valueData, ttl).then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected putTransientInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return super
            .putTransientInternal(keyData, valueData, ttl).then<void>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected executeOnKeyInternal(keyData: Data, proData: Data): Promise<V> {
        return super.executeOnKeyInternal(keyData, proData).then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected putInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return super.putInternal(keyData, valueData, ttl).then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
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
        return super.tryRemoveInternal(keyData, timeout).then<boolean>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected removeInternal(keyData: Data, value: V): Promise<V> {
        return super.removeInternal(keyData, value).then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected getAllInternal(partitionsToKeys: { [id: string]: any }, result: any[] = []): Promise<any[]> {
        const promises = [];
        try {
            for (const partition in partitionsToKeys) {
                let partitionArray = partitionsToKeys[partition];
                for (let i = partitionArray.length - 1; i >= 0; i--) {
                    const key = partitionArray[i];
                    promises.push(this.nearCache.get(key).then((cachedResult) => {
                        if (cachedResult !== undefined) {
                            result.push([this.toObject(partitionArray[i]), cachedResult]);
                            partitionArray = partitionArray.splice(i, 1);
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
            return super.getAllInternal(partitionsToKeys, result).then((serializedEntryArray: Array<[Data, Data]>) => {
                serializedEntryArray.forEach((serializedEntry: [Data, Data], index: number) => {
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
        return super.replaceInternal(keyData, valueData).then<V>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected setInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return super.setInternal(keyData, valueData, ttl).then<void>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    protected tryPutInternal(keyData: Data, valueData: Data, timeout: number): Promise<boolean> {
        return super.tryPutInternal(keyData, valueData, timeout)
            .then<boolean>(this.invalidateCacheEntryAndReturn.bind(this, keyData));
    }

    private removeNearCacheInvalidationListener(): Promise<boolean> {
        this.client.getRepairingTask().deregisterHandler(this.name);
        return this.client.getListenerService().deregisterListener(this.invalidationListenerId);
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
        if (this.supportsRepairableNearCache()) {
            return this.createNearCacheEventHandler().then((handler) => {
                return this.client.getListenerService().registerListener(codec, handler);
            });
        } else {
            return this.client.getListenerService().registerListener(codec, this.createPre38NearCacheEventHandler());
        }
    }

    private createInvalidationListenerCodec(name: string, flags: number): ListenerMessageCodec {
        if (this.supportsRepairableNearCache()) {
            return {
                encodeAddRequest(localOnly: boolean): ClientMessage {
                    return MapAddNearCacheInvalidationListenerCodec.encodeRequest(name, flags, localOnly);

                },
                decodeAddResponse(msg: ClientMessage): string {
                    return MapAddNearCacheInvalidationListenerCodec.decodeResponse(msg).response;
                },
                encodeRemoveRequest(listenerId: string): ClientMessage {
                    return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
                },
            };
        } else {
            return {
                encodeAddRequest(localOnly: boolean): ClientMessage {
                    return MapAddNearCacheEntryListenerCodec.encodeRequest(name, flags, localOnly);
                },
                decodeAddResponse(msg: ClientMessage): string {
                    return MapAddNearCacheEntryListenerCodec.decodeResponse(msg).response;
                },
                encodeRemoveRequest(listenerId: string): ClientMessage {
                    return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
                },
            };
        }
    }

    private supportsRepairableNearCache(): boolean {
        return this.getConnectedServerVersion() >= BuildInfo.calculateServerVersion(3, 8, 0);
    }

    private createPre38NearCacheEventHandler(): Function {
        const nearCache = this.nearCache;
        const handle = function (keyData: Data): void {
            if (keyData == null) {
                nearCache.clear();
            } else {
                nearCache.invalidate(keyData);
            }
        };
        const handleBatch = function (keys: Data[]): void {
            keys.forEach((key: Data) => {
                nearCache.invalidate(key);
            });
        };

        return function (m: ClientMessage): void {
            MapAddNearCacheEntryListenerCodec.handle(m, handle, handleBatch);
        };
    }

    private createNearCacheEventHandler(): Promise<Function> {
        const repairingTask = this.client.getRepairingTask();
        return repairingTask.registerAndGetHandler(this.getName(), this.nearCache).then((repairingHandler) => {
            const staleReadDetector = new StaleReadDetectorImpl(repairingHandler, this.client.getPartitionService());
            this.nearCache.setStaleReadDetector(staleReadDetector);
            const handle = function (key: Data, sourceUuid: string, partitionUuid: UUID, sequence: Long): void {
                repairingHandler.handle(key, sourceUuid, partitionUuid, sequence);
            };
            const handleBatch = function (keys: Data[], sourceUuids: string[], partititonUuids: UUID[], sequences: Long[]): void {
                repairingHandler.handleBatch(keys, sourceUuids, partititonUuids, sequences);
            };

            return function (m: ClientMessage): void {
                MapAddNearCacheInvalidationListenerCodec.handle(m, handle, handleBatch);
            };
        });
    }
}
