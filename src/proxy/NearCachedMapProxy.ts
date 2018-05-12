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

import {MapProxy} from './MapProxy';
import HazelcastClient from '../HazelcastClient';
import {NearCache, NearCacheImpl} from '../nearcache/NearCache';
import {Data} from '../serialization/Data';
import * as Promise from 'bluebird';
import {MapAddNearCacheEntryListenerCodec} from '../codec/MapAddNearCacheEntryListenerCodec';
import {EntryEventType} from '../core/EntryEventType';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {MapRemoveEntryListenerCodec} from '../codec/MapRemoveEntryListenerCodec';
import {BuildMetadata} from '../BuildMetadata';
import {MapAddNearCacheInvalidationListenerCodec} from '../codec/MapAddNearCacheInvalidationListenerCodec';
import {StaleReadDetectorImpl} from '../nearcache/StaleReadDetectorImpl';
import {UUID} from '../core/UUID';
import ClientMessage = require('../ClientMessage');

const MIN_EVENTUALLY_CONSISTENT_NEARCACHE_VERSION = BuildMetadata.calculateVersion('3.8');

export class NearCachedMapProxy<K, V> extends MapProxy<K, V> {

    private nearCache: NearCache;
    private invalidationListenerId: string;

    constructor(client: HazelcastClient, servicename: string, name: string) {
        super(client, servicename, name);
        this.nearCache = new NearCacheImpl(this.client.getConfig().getNearCacheConfig(name),
            this.client.getSerializationService());
        if (this.nearCache.isInvalidatedOnChange()) {
            this.addNearCacheInvalidationListener().then((id: string) => {
                this.invalidationListenerId = id;
            });
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
        var cachedValue = this.nearCache.get(keyData);
        if (cachedValue !== undefined) {
            return Promise.resolve(cachedValue != null);
        } else {
            return super.containsKeyInternal(keyData);
        }
    }

    protected deleteInternal(keyData: Data): Promise<void> {
        this.nearCache.invalidate(keyData);
        return super.deleteInternal(keyData).then<void>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected evictInternal(key: Data): Promise<boolean> {
        return super.evictInternal(key).then<boolean>(this.invalidatCacheEntryAndReturn.bind(this, key));
    }

    protected putAllInternal(partitionsToKeysData: { [id: string]: [Data, Data][] }): Promise<void> {
        return super.putAllInternal(partitionsToKeysData).then(() => {
            for (var partition in partitionsToKeysData) {
                partitionsToKeysData[partition].forEach((entry: [Data, Data]) => {
                    this.nearCache.invalidate(entry[0]);
                });
            }
        });
    }

    protected postDestroy(): Promise<void> {
        return this.removeNearCacheInvalidationListener().then(() => {
            this.client.getRepairingTask().deregisterHandler(this.name);
        }).then(() => {
            return super.postDestroy();
        });
    }

    protected putIfAbsentInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return super.putIfAbsentInternal(keyData, valueData, ttl).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected putTransientInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return super
            .putTransientInternal(keyData, valueData, ttl).then<void>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected executeOnKeyInternal(keyData: Data, proData: Data): Promise<V> {
        return super.executeOnKeyInternal(keyData, proData).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected putInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return super.putInternal(keyData, valueData, ttl).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected getInternal(keyData: Data): Promise<V> {
        var cachedValue = this.nearCache.get(keyData);
        if (cachedValue !== undefined) {
            return Promise.resolve(cachedValue);
        } else {
            let reservation = this.nearCache.tryReserveForUpdate(keyData);
            return super.getInternal(keyData).then((val: V) => {
                this.nearCache.tryPublishReserved(keyData, val, reservation);
                return val;
            }).catch((err: any) => {
                throw err;
            });
        }
    }

    protected tryRemoveInternal(keyData: Data, timeout: number): Promise<boolean> {
        return super.tryRemoveInternal(keyData, timeout).then<boolean>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected removeInternal(keyData: Data, value: V): Promise<V> {
        return super.removeInternal(keyData, value).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected getAllInternal(partitionsToKeys: { [id: string]: any }, result: any[] = []): Promise<any[]> {
        try {
            for (var partition in partitionsToKeys) {
                var partitionArray = partitionsToKeys[partition];
                for (var i = partitionArray.length - 1; i >= 0; i--) {
                    let key = partitionArray[i];
                    var cachedResult = this.nearCache.get(key);
                    if (cachedResult !== undefined) {
                        result.push([this.toObject(partitionArray[i]), cachedResult]);
                        partitionArray = partitionArray.splice(i, 1);
                    }
                }
            }
        } catch (err) {
            return Promise.resolve([]);
        }
        let reservations: Long[] = [];
        for (var partition in partitionsToKeys) {
            var partitionArray = partitionsToKeys[partition];
            for (var i = 0; i < partitionArray.length; i++) {
                let key = partitionArray[i];
                reservations.push(this.nearCache.tryReserveForUpdate(key));
            }
        }
        return super.getAllInternal(partitionsToKeys, result).then((serializedEntryArray: [Data, Data][]) => {
            serializedEntryArray.forEach((serializedEntry: [Data, Data], index: number) => {
                let key = serializedEntry[0];
                let value = serializedEntry[1];
                this.nearCache.tryPublishReserved(key, value, reservations[index]);
            });
            return result;
        });
    }

    protected replaceIfSameInternal(keyData: Data, oldValueData: Data, newValueData: Data): Promise<boolean> {
        return super.replaceIfSameInternal(keyData, oldValueData, newValueData)
            .then<boolean>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected replaceInternal(keyData: Data, valueData: Data): Promise<V> {
        return super.replaceInternal(keyData, valueData).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected setInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return super.setInternal(keyData, valueData, ttl).then<void>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected tryPutInternal(keyData: Data, valueData: Data, timeout: number): Promise<boolean> {
        return super.tryPutInternal(keyData, valueData, timeout)
            .then<boolean>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    private invalidatCacheEntryAndReturn<T>(keyData: Data, retVal: T): T {
        this.nearCache.invalidate(keyData);
        return retVal;
    }

    private invalidateCacheAndReturn<T>(retVal: T): T {
        this.nearCache.clear();
        return retVal;
    }

    private removeNearCacheInvalidationListener() {
        return this.client.getListenerService().deregisterListener(this.invalidationListenerId);
    }

    private addNearCacheInvalidationListener(): Promise<string> {
        let codec = this.createInvalidationListenerCodec(this.name, EntryEventType.INVALIDATION);
        if (this.supportsRepairableNearCache()) {
            return this.client.getListenerService().registerListener(codec, this.createNearCacheEventHandler());
        } else {
            return this.client.getListenerService().registerListener(codec, this.createPre38NearCacheEventHandler());
        }
    }

    private createInvalidationListenerCodec(name: string, flags: number): ListenerMessageCodec {
        if (this.supportsRepairableNearCache()) {
            return {
                encodeAddRequest: function (localOnly: boolean): ClientMessage {
                    return MapAddNearCacheInvalidationListenerCodec.encodeRequest(name, flags, localOnly);

                },
                decodeAddResponse: function (msg: ClientMessage): string {
                    return MapAddNearCacheInvalidationListenerCodec.decodeResponse(msg).response;
                },
                encodeRemoveRequest: function (listenerId: string): ClientMessage {
                    return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
                }
            };
        } else {
            return {
                encodeAddRequest: function (localOnly: boolean): ClientMessage {
                    return MapAddNearCacheEntryListenerCodec.encodeRequest(name, flags, localOnly);
                },
                decodeAddResponse: function (msg: ClientMessage): string {
                    return MapAddNearCacheEntryListenerCodec.decodeResponse(msg).response;
                },
                encodeRemoveRequest: function (listenerId: string): ClientMessage {
                    return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
                }
            };
        }
    }

    private supportsRepairableNearCache(): boolean {
        return this.getConnectedServerVersion() >= MIN_EVENTUALLY_CONSISTENT_NEARCACHE_VERSION;
    }

    private createPre38NearCacheEventHandler() {
        let nearCache = this.nearCache;
        let handle = function (keyData: Data) {
            if (keyData == null) {
                nearCache.clear();
            } else {
                nearCache.invalidate(keyData);
            }
        };
        let handleBatch = function (keys: Array<Data>) {
            keys.forEach((key: Data) => {
                nearCache.invalidate(key);
            });
        };

        return function (m: ClientMessage) {
            MapAddNearCacheEntryListenerCodec.handle(m, handle, handleBatch);
        };
    }

    private createNearCacheEventHandler() {
        let repairingTask = this.client.getRepairingTask();
        let repairingHandler = repairingTask.registerAndGetHandler(this.getName(), this.nearCache);
        let staleReadDetector = new StaleReadDetectorImpl(repairingHandler, this.client.getPartitionService());
        this.nearCache.setStaleReadDetector(staleReadDetector);
        let handle = function (key: Data, sourceUuid: string, partitionUuid: UUID, sequence: Long) {
            repairingHandler.handle(key, sourceUuid, partitionUuid, sequence);
        };
        let handleBatch = function (keys: Data[], sourceUuids: string[], partititonUuids: UUID[], sequences: Long[]) {
            repairingHandler.handleBatch(keys, sourceUuids, partititonUuids, sequences);
        };

        return function (m: ClientMessage) {
            MapAddNearCacheInvalidationListenerCodec.handle(m, handle, handleBatch);
        };
    }
}
