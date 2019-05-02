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

var RC = require('../RC');
var HazelcastClient = require('../../').Client;
var expect = require('chai').expect;
var Config = require('../../').Config;
var fs = require('fs');
var Long = require('long');
var Util = require('../Util');
var DeferredPromise = require('../../lib/Util').DeferredPromise;

describe('LostInvalidation', function () {
    this.timeout(30000);

    var cluster;
    var member;
    var client;
    var modifyingClient;

    var entryCount = 1000;
    var mapName = 'ncmap';

    function createConfig() {
        var cfg = new Config.ClientConfig();
        var ncConfig = new Config.NearCacheConfig();
        ncConfig.name = mapName;
        cfg.nearCacheConfigs[mapName] = ncConfig;
        cfg.properties['hazelcast.invalidation.reconciliation.interval.seconds'] = 1;
        cfg.properties['hazelcast.invalidation.min.reconciliation.interval.seconds'] = 1;
        cfg.properties['hazelcast.invalidation.max.tolerated.miss.count'] = 2;
        return cfg;
    }

    before(function () {
        return RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_eventual_nearcache.xml', 'utf8')).then(function (resp) {
            cluster = resp;
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member = m;
        });
    });

    beforeEach(function () {
        return HazelcastClient.newHazelcastClient(createConfig()).then(function (resp) {
            client = resp;
            return HazelcastClient.newHazelcastClient();
        }).then(function (resp) {
            modifyingClient = resp;
        });
    });

    afterEach(function () {
        client.shutdown();
        modifyingClient.shutdown();
    });

    after(function () {
        return RC.shutdownCluster(cluster.id);
    });

    it('client eventually receives an update for which the invalidation event was dropped', function () {
        Util.markServerVersionAtLeast(this, client, '3.8');

        var key = 'key';
        var value = 'val';
        var updatedval = 'updatedval';
        var invalidationHandlerStub;
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
        Util.markServerVersionAtLeast(this, client, '3.8');
        var invalidationHandlerStub;
        var map;
        var entries = [];
        return client.getMap(mapName).then(function (mp) {
            map = mp;
            return Util.promiseWaitMilliseconds(100);
        }).then(function (resp) {
            invalidationHandlerStub = blockInvalidationEvents(client, map);
            for (var i = 0; i < entryCount; i++) {
                entries.push([i, i]);
            }
            return modifyingClient.getMap(mapName);
        }).then(function (mp) {
            return mp.putAll(entries);
        }).then(function () {
            var requestedKeys = [];
            for (var i = 0; i < entryCount; i++) {
                requestedKeys.push(i);
            }
            //populate near cache
            return map.getAll(requestedKeys);
        }).then(function () {
            entries = [];
            for (var i = 0; i < entryCount; i++) {
                entries.push([i, i + entryCount]);
            }
            return modifyingClient.getMap(mapName);
        }).then(function (mp) {
            return mp.putAll(entries);
        }).then(function () {
            unblockInvalidationEvents(client, invalidationHandlerStub);
            return Util.promiseWaitMilliseconds(2000);
        }).then(function () {
            var promises = [];
            for (var i = 0; i < entryCount; i++) {
                var promise = (function (key) {
                    return map.get(key).then((val) => {
                        return expect(val).to.equal(key + entryCount);
                    });
                })(i);
                promises.push(promise);
            }
            return Promise.all(promises);
        });
    });

    function blockInvalidationEvents(client, nearCachedMap, notifyAfterNumberOfEvents) {
        var listenerId = nearCachedMap.invalidationListenerId;
        var clientRegistrationKey = client.getListenerService().activeRegistrations.get(listenerId).get(client.clusterService.getOwnerConnection());
        var correlationId = clientRegistrationKey.correlationId;
        var handler = client.getInvocationService().eventHandlers[correlationId.toNumber()].handler;
        var numberOfBlockedInvalidations = 0;
        var deferred = DeferredPromise();
        client.getInvocationService().eventHandlers[correlationId.toNumber()].handler = function () {
            numberOfBlockedInvalidations++;
            if (notifyAfterNumberOfEvents !== undefined && notifyAfterNumberOfEvents === numberOfBlockedInvalidations) {
                deferred.resolve();
            }
        };
        return {handler: handler, correlationId: correlationId, notificationHandler: deferred.promise};
    }

    function unblockInvalidationEvents(client, metadata) {
        client.getInvocationService().eventHandlers[metadata.correlationId.toNumber()].handler = metadata.handler;
    }
});
