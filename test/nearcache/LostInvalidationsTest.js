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
'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const RC = require('../RC');
const { Client } = require('../../');
const { DeferredPromise } = require('../../lib/util/Util');
const Util = require('../Util');

describe('LostInvalidationTest', function () {
    this.timeout(30000);

    let cluster;
    let client;
    let modifyingClient;

    const entryCount = 1000;
    const mapName = 'ncmap';

    function blockInvalidationEvents(client, nearCachedMap, notifyAfterNumberOfEvents) {
        const listenerId = nearCachedMap.invalidationListenerId;
        const clientRegistrationKey = client.getListenerService().activeRegistrations
            .get(listenerId).get(client.getConnectionManager().getRandomConnection());
        const correlationId = clientRegistrationKey.correlationId;
        const handler = client.getInvocationService().eventHandlers.get(correlationId).handler;
        const deferred = DeferredPromise();
        let numberOfBlockedInvalidations = 0;
        client.getInvocationService().eventHandlers.get(correlationId).handler = () => {
            numberOfBlockedInvalidations++;
            if (notifyAfterNumberOfEvents !== undefined && notifyAfterNumberOfEvents === numberOfBlockedInvalidations) {
                deferred.resolve();
            }
        };
        return {
            handler,
            correlationId,
            notificationHandler: deferred.promise
        };
    }

    function unblockInvalidationEvents(client, metadata) {
        client.getInvocationService().eventHandlers.get(metadata.correlationId).handler = metadata.handler;
    }

    before(function () {
        return RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_eventual_nearcache.xml', 'utf8'))
            .then(function (resp) {
                cluster = resp;
                return RC.startMember(cluster.id);
            });
    });

    beforeEach(function () {
        return Client.newHazelcastClient({
            clusterName: cluster.id,
            nearCaches: {
                [mapName]: {}
            },
            properties: {
                'hazelcast.invalidation.reconciliation.interval.seconds': 1,
                'hazelcast.invalidation.min.reconciliation.interval.seconds': 1,
                'hazelcast.invalidation.max.tolerated.miss.count': 2
            }
        }).then(function (resp) {
            client = resp;
            return Client.newHazelcastClient({ clusterName: cluster.id });
        }).then(function (resp) {
            modifyingClient = resp;
        });
    });

    afterEach(function () {
        client.shutdown();
        modifyingClient.shutdown();
    });

    after(function () {
        return RC.terminateCluster(cluster.id);
    });

    it('client eventually receives an update for which the invalidation event was dropped', function () {
        const key = 'key';
        const value = 'val';
        const updatedval = 'updatedval';
        let map;
        let invalidationHandlerStub;

        return client.getMap(mapName).then(function (mp) {
            map = mp;
            return Util.promiseWaitMilliseconds(100)
        }).then(function (resp) {
            invalidationHandlerStub = blockInvalidationEvents(client, map, 1);
            return modifyingClient.getMap(mapName);
        }).then(function (mp) {
            return mp.put(key, value);
        }).then(function () {
            return map.get(key);
        }).then(function () {
            return modifyingClient.getMap(mapName);
        }).then(function (mp) {
            return mp.put(key, updatedval);
        }).then(function () {
            return Util.promiseWaitMilliseconds(1000);
        }).then(function () {
            unblockInvalidationEvents(client, invalidationHandlerStub);
            return Util.promiseWaitMilliseconds(1000);
        }).then(function () {
            return map.get(key);
        }).then(function (result) {
            return expect(result).to.equal(updatedval);
        });
    });

    it('lost invalidation stress test', function () {
        let invalidationHandlerStub;
        let map;
        let entries = [];

        return client.getMap(mapName).then(function (mp) {
            map = mp;
            return Util.promiseWaitMilliseconds(100);
        }).then(function (resp) {
            invalidationHandlerStub = blockInvalidationEvents(client, map);
            for (let i = 0; i < entryCount; i++) {
                entries.push([i, i]);
            }
            return modifyingClient.getMap(mapName);
        }).then(function (mp) {
            return mp.putAll(entries);
        }).then(function () {
            const requestedKeys = [];
            for (let i = 0; i < entryCount; i++) {
                requestedKeys.push(i);
            }
            // populate near cache
            return map.getAll(requestedKeys);
        }).then(function () {
            entries = [];
            for (let i = 0; i < entryCount; i++) {
                entries.push([i, i + entryCount]);
            }
            return modifyingClient.getMap(mapName);
        }).then(function (mp) {
            return mp.putAll(entries);
        }).then(function () {
            unblockInvalidationEvents(client, invalidationHandlerStub);
            return Util.promiseWaitMilliseconds(2000);
        }).then(function () {
            const promises = [];
            for (let i = 0; i < entryCount; i++) {
                const promise = (function (key) {
                    return map.get(key).then((val) => {
                        return expect(val).to.equal(key + entryCount);
                    });
                })(i);
                promises.push(promise);
            }
            return Promise.all(promises);
        });
    });
});
