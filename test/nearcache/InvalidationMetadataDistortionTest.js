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
const Promise = require('bluebird');
const RC = require('../RC');
const Client = require('../..').Client;

const identifiedFactory = require('../javaclasses/IdentifiedFactory');
const DistortInvalidationMetadataEntryProcessor = require('../javaclasses/DistortInvalidationMetadataEntryProcessor');

describe('Invalidation metadata distortion', function () {

    let cluster;
    let client;
    let validationClient;
    const mapName = 'nc-map';
    const mapSize = 10;

    before(function () {
        return RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_eventual_nearcache.xml', 'utf8'))
            .then(function (cl) {
                cluster = cl;
                return RC.startMember(cluster.id);
            });
    });

    after(function () {
        return RC.terminateCluster(cluster.id);
    });

    afterEach(function () {
        return client.shutdown()
            .then(() => validationClient.shutdown());
    });

    function createConfig(withNearCache) {
        const cfg = {
            clusterName: cluster.id,
            nearCaches: {},
            serialization: {
                defaultNumberType: 'integer',
                dataSerializableFactories: {
                    66: identifiedFactory
                }
            }
        };
        if (withNearCache) {
            cfg.nearCaches[mapName] = {};
        }
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
        this.timeout(13000);
        let stopTest = false;
        let map;
        const populatePromises = [];
        const ignoredKey = mapSize;
        client.getMap(mapName).then(function (mp) {
            map = mp;
            for (let i = 0; i < mapSize; i++) {
                populatePromises.push(map.put(i, i));
            }
            populatePromises.push(map.put(ignoredKey, ignoredKey));
        }).then(function () {
            return Promise.all(populatePromises).then(function () {
                map.executeOnKey(ignoredKey, new DistortInvalidationMetadataEntryProcessor(mapName, mapSize, 5))
                    .then(function () {
                        stopTest = true;
                    })
                    .catch(function (err) {
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
                const promises = [];
                for (let i = 0; i < mapSize; i++) {
                    promises.push(map.get(i));
                }
                Promise.all(promises).then(function () {
                    setTimeout(populateNearCacheAndCompare, 0);
                });
            } else {
                const comparisonPromises = [];
                for (let i = 0; i < mapSize; i++) {
                    comparisonPromises.push(compareActualAndExpected(map, validationClient.getMap(mapName), i));
                }
                Promise.all(comparisonPromises).then(() => {
                    done();
                }).catch(done);
            }
        }

    });
});
