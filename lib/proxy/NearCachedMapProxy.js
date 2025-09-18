"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NearCachedMapProxy = void 0;
const MapAddNearCacheInvalidationListenerCodec_1 = require("../codec/MapAddNearCacheInvalidationListenerCodec");
const MapRemoveEntryListenerCodec_1 = require("../codec/MapRemoveEntryListenerCodec");
const MapGetAllCodec_1 = require("./../codec/MapGetAllCodec");
const EventType_1 = require("./EventType");
const StaleReadDetector_1 = require("../nearcache/StaleReadDetector");
const MapProxy_1 = require("./MapProxy");
const core_1 = require("../core");
/** @internal */
class NearCachedMapProxy extends MapProxy_1.MapProxy {
    constructor(servicename, name, logger, proxyManager, partitionService, invocationService, serializationService, nearCacheManager, getRepairingTask, listenerService, clusterService, connectionRegistry, schemaService) {
        super(servicename, name, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService);
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
        }
        else {
            this.nearCache.setReady();
        }
    }
    clear() {
        return super.clear().then(this.invalidateCacheAndReturn.bind(this));
    }
    evictAll() {
        this.nearCache.clear();
        return super.evictAll().then(this.invalidateCacheAndReturn.bind(this));
    }
    containsKeyInternal(keyData) {
        return this.nearCache.get(keyData).then((cachedValue) => {
            if (cachedValue !== undefined) {
                return Promise.resolve(cachedValue != null);
            }
            else {
                return super.containsKeyInternal(keyData);
            }
        });
    }
    deleteInternal(keyData) {
        this.nearCache.invalidate(keyData);
        return super.deleteInternal(keyData)
            .then(() => this.invalidateCacheEntryAndReturn(keyData));
    }
    evictInternal(key) {
        return super.evictInternal(key)
            .then(evicted => this.invalidateCacheEntryAndReturn(key, evicted));
    }
    finalizePutAll(partitionsToKeysData) {
        for (const partition in partitionsToKeysData) {
            partitionsToKeysData[partition].forEach((entry) => {
                this.nearCache.invalidate(entry[0]);
            });
        }
    }
    postDestroy() {
        return this.removeNearCacheInvalidationListener().then(() => {
            this.nearCacheManager.destroyNearCache(this.name);
        }).then(() => {
            return super.postDestroy();
        });
    }
    putIfAbsentInternal(keyData, valueData, ttl = -1, maxIdle) {
        return super.putIfAbsentInternal(keyData, valueData, ttl, maxIdle)
            .then(oldValue => this.invalidateCacheEntryAndReturn(keyData, oldValue));
    }
    putTransientInternal(keyData, valueData, ttl = -1, maxIdle) {
        return super.putTransientInternal(keyData, valueData, ttl, maxIdle)
            .then(() => this.invalidateCacheEntryAndReturn(keyData));
    }
    executeOnKeyInternal(keyData, proData) {
        return super.executeOnKeyInternal(keyData, proData)
            .then(result => this.invalidateCacheEntryAndReturn(keyData, result));
    }
    putInternal(keyData, valueData, ttl = -1, maxIdle) {
        return super.putInternal(keyData, valueData, ttl, maxIdle)
            .then(oldValue => this.invalidateCacheEntryAndReturn(keyData, oldValue));
    }
    getInternal(keyData) {
        return this.nearCache.get(keyData).then((cachedValue) => {
            if (cachedValue !== undefined) {
                return Promise.resolve(cachedValue);
            }
            else {
                const reservation = this.nearCache.tryReserveForUpdate(keyData);
                return super.getInternal(keyData).then((val) => {
                    this.nearCache.tryPublishReserved(keyData, val, reservation);
                    return val;
                }).catch((err) => {
                    throw err;
                });
            }
        });
    }
    tryRemoveInternal(keyData, timeout) {
        return super.tryRemoveInternal(keyData, timeout)
            .then(removed => this.invalidateCacheEntryAndReturn(keyData, removed));
    }
    removeInternal(keyData, valueData) {
        return super.removeInternal(keyData, valueData)
            .then(oldValue => this.invalidateCacheEntryAndReturn(keyData, oldValue));
    }
    removeAllInternal(predicate) {
        try {
            return super.removeAllInternal(predicate);
        }
        finally {
            this.nearCache.clear();
        }
    }
    getAllInternalHelper(partitionsToKeys, result = []) {
        const partitionPromises = [];
        for (const partition in partitionsToKeys) {
            partitionPromises.push(this.encodeInvokeOnPartition(MapGetAllCodec_1.MapGetAllCodec, Number(partition), (clientMessage) => {
                const getAllResponse = MapGetAllCodec_1.MapGetAllCodec.decodeResponse(clientMessage);
                return getAllResponse;
            }, partitionsToKeys[partition]));
        }
        const deserializeEntry = (entry) => {
            return [this.toObject(entry[0]), this.toObject(entry[1])];
        };
        const deserializeEntries = (serializedEntryArray) => {
            try {
                return Promise.resolve(serializedEntryArray.map(deserializeEntry));
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotFoundError) {
                    return this.invocationService.fetchSchema(e.schemaId).then(() => {
                        return serializedEntryArray.map(deserializeEntry);
                    }).catch(e => {
                        if (e instanceof core_1.SchemaNotFoundError) {
                            return deserializeEntries(serializedEntryArray);
                        }
                        else {
                            throw e;
                        }
                    });
                }
                throw e;
            }
        };
        return Promise.all(partitionPromises).then((serializedEntryArrayArray) => {
            const serializedEntryArray = Array.prototype.concat.apply([], serializedEntryArrayArray);
            return deserializeEntries(serializedEntryArray).then((deserializedEntries) => {
                result.push(...deserializedEntries);
                return serializedEntryArray;
            });
        });
    }
    getAllInternal(partitionsToKeys, result = []) {
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
        }
        catch (err) {
            return Promise.resolve([]);
        }
        return Promise.all(promises).then(() => {
            const reservations = [];
            for (const partition in partitionsToKeys) {
                const partitionArray = partitionsToKeys[partition];
                for (const key of partitionArray) {
                    reservations.push(this.nearCache.tryReserveForUpdate(key));
                }
            }
            return this.getAllInternalHelper(partitionsToKeys, result).then((serializedEntryArray) => {
                serializedEntryArray.forEach((entry, index) => {
                    const key = entry[0];
                    const value = entry[1];
                    this.nearCache.tryPublishReserved(key, value, reservations[index]);
                });
                return result;
            });
        });
    }
    replaceIfSameInternal(keyData, oldValueData, newValueData) {
        return super.replaceIfSameInternal(keyData, oldValueData, newValueData)
            .then(replaced => this.invalidateCacheEntryAndReturn(keyData, replaced));
    }
    replaceInternal(keyData, valueData) {
        return super.replaceInternal(keyData, valueData)
            .then(replaced => this.invalidateCacheEntryAndReturn(keyData, replaced));
    }
    setInternal(keyData, valueData, ttl = -1, maxIdle) {
        return super.setInternal(keyData, valueData, ttl, maxIdle)
            .then(() => this.invalidateCacheEntryAndReturn(keyData));
    }
    tryPutInternal(keyData, valueData, timeout) {
        return super.tryPutInternal(keyData, valueData, timeout)
            .then(put => this.invalidateCacheEntryAndReturn(keyData, put));
    }
    setTtlInternal(keyData, ttl) {
        return super.setTtlInternal(keyData, ttl)
            .then(setTtl => this.invalidateCacheEntryAndReturn(keyData, setTtl));
    }
    removeNearCacheInvalidationListener() {
        this.getRepairingTask().deregisterHandler(this.name);
        return this.listenerService.deregisterListener(this.invalidationListenerId);
    }
    invalidateCacheEntryAndReturn(keyData, retVal) {
        this.nearCache.invalidate(keyData);
        return retVal;
    }
    invalidateCacheAndReturn(retVal) {
        this.nearCache.clear();
        return retVal;
    }
    addNearCacheInvalidationListener() {
        const codec = this.createInvalidationListenerCodec(this.name, EventType_1.EventType.INVALIDATION);
        return this.createNearCacheEventHandler().then((handler) => {
            return this.listenerService.registerListener(codec, handler);
        });
    }
    createInvalidationListenerCodec(name, flags) {
        return {
            encodeAddRequest(localOnly) {
                return MapAddNearCacheInvalidationListenerCodec_1.MapAddNearCacheInvalidationListenerCodec.encodeRequest(name, flags, localOnly);
            },
            decodeAddResponse(msg) {
                return MapAddNearCacheInvalidationListenerCodec_1.MapAddNearCacheInvalidationListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return MapRemoveEntryListenerCodec_1.MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    createNearCacheEventHandler() {
        const repairingTask = this.getRepairingTask();
        return repairingTask.registerAndGetHandler(this.getName(), this.nearCache).then((repairingHandler) => {
            const staleReadDetector = new StaleReadDetector_1.StaleReadDetectorImpl(repairingHandler, this.partitionService);
            this.nearCache.setStaleReadDetector(staleReadDetector);
            const handle = (key, sourceUuid, partitionUuid, sequence) => {
                repairingHandler.handle(key, sourceUuid, partitionUuid, sequence);
            };
            const handleBatch = (keys, sourceUuids, partititonUuids, sequences) => {
                repairingHandler.handleBatch(keys, sourceUuids, partititonUuids, sequences);
            };
            return (message) => {
                MapAddNearCacheInvalidationListenerCodec_1.MapAddNearCacheInvalidationListenerCodec.handle(message, handle, handleBatch);
            };
        });
    }
}
exports.NearCachedMapProxy = NearCachedMapProxy;
//# sourceMappingURL=NearCachedMapProxy.js.map