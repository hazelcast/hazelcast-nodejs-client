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

var Controller = require('../RC');
var Client = require('../..').Client;
var Config = require('../..').Config;
var fs = require('fs');
var IdentifiedFactory = require('../javaclasses/IdentifiedFactory');
var DistortInvalidationMetadataEntryProcessor = require('../javaclasses/DistortInvalidationMetadataEntryProcessor');
var Promise = require('bluebird');
var expect = require('chai').expect;
var Util = require('../Util');

describe('Invalidation metadata distortion', function () {

    var cluster;
    var member;
    var client;
    var validationClient;
    var mapName = 'nc-map';
    var mapSize = 10;

    before(function () {
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_eventual_nearcache.xml', 'utf8')).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        }).then(function (mem) {
            member = mem;
        });
    });

    after(function () {
        return Controller.shutdownCluster(cluster.id);
    });

    afterEach(function () {
        client.shutdown();
        validationClient.shutdown();
    });

    function createConfig(withNearCache) {
        var cfg = new Config.ClientConfig();
        if (withNearCache) {
            var ncc = new Config.NearCacheConfig();
            ncc.name = mapName;
            cfg.nearCacheConfigs[mapName] = ncc;
        }
        cfg.serializationConfig.defaultNumberType = "integer";
        cfg.serializationConfig.dataSerializableFactories[66] = new IdentifiedFactory();
        return cfg;
    }

    beforeEach(function () {
        return Client.newHazelcastClient(createConfig(true)).then(function (cl) {
            client = cl;
            return Client.newHazelcastClient(createConfig(false));
        }).then(function (cl) {
            validationClient = cl;
        });
    });


    it('lost invalidation', function (done) {
        Util.markServerVersionAtLeast(this, client, '3.8');

        this.timeout(13000);
        var stopTest = false;
        var map;
        var populatePromises = [];
        var ignoredKey = mapSize;
        client.getMap(mapName).then(function (mp) {
            map = mp;
            for (var i = 0; i < mapSize; i++) {
                populatePromises.push(map.put(i, i));
            }
            populatePromises.push(map.put(ignoredKey, ignoredKey));
        }).then(function () {
            return Promise.all(populatePromises).then(function () {
                map.executeOnKey(ignoredKey, new DistortInvalidationMetadataEntryProcessor(mapName, mapSize, 5)).then(function () {
                    stopTest = true;
                }).catch(function (err) {
                    done(err);
                });
                setTimeout(populateNearCacheAndCompare, 100);
            })
        });


        function compareActualAndExpected(actualMap, verificationMap, index) {
            return actualMap.get(index).then(function (actual) {
                return verificationMap.then(function (mp) {
                    return mp.get(index);
                }).then(function (expected) {
                    return expect(actual).to.equal(expected);
                });
            });
        }

        function populateNearCacheAndCompare() {
            if (!stopTest) {
                var promises = [];
                for (var i = 0; i < mapSize; i++) {
                    promises.push(map.get(i));
                }
                Promise.all(promises).then(function () {
                    setTimeout(populateNearCacheAndCompare, 0);
                });
            } else {
                var comparisonPromises = [];
                for (var i = 0; i < mapSize; i++) {
                    comparisonPromises.push(compareActualAndExpected(map, validationClient.getMap(mapName), i));
                }
                Promise.all(comparisonPromises).then(() => {
                    done()
                }).catch(done);
            }
        }

    });
});
