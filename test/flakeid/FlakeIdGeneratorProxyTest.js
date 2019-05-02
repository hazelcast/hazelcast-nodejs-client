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


var expect = require('chai').expect;
var HazelcastClient = require('../../.').Client;
var Controller = require('./../RC');
var Config = require('../../.').Config;
var Util = require('./../Util');
var Promise = require('bluebird');
var Long = require('long');

describe("FlakeIdGeneratorProxyTest", function () {

    var FLAKE_ID_STEP = 1 << 16;
    var SHORT_TERM_BATCH_SIZE = 3;
    var SHORT_TERM_VALIDITY_MILLIS = 3000;

    var cluster;
    var client;
    var flakeIdGenerator;

    before(function () {
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            var cfg = new Config.ClientConfig();
            var flakeConfig = new Config.FlakeIdGeneratorConfig();
            flakeConfig.prefetchValidityMillis = SHORT_TERM_VALIDITY_MILLIS;
            flakeConfig.prefetchCount = SHORT_TERM_BATCH_SIZE;
            flakeConfig.name = 'shortterm';
            cfg.flakeIdGeneratorConfigs['shortterm'] = flakeConfig;
            return HazelcastClient.newHazelcastClient(cfg).then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        Util.markServerVersionAtLeast(this, client, '3.10');
    });

    afterEach(function () {
        return flakeIdGenerator.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    function addToListFunction(l) {
        return function (val) {
            l.push(val);
        }
    }

    it('newId succeeds', function () {
        return client.getFlakeIdGenerator('test').then(function (idGenerator) {
            flakeIdGenerator = idGenerator;
            return flakeIdGenerator.newId();
        });
    });

    it('newId returns a unique long', function () {
        return client.getFlakeIdGenerator('test').then(function (idGenerator) {
            flakeIdGenerator = idGenerator;
            var promise = Promise.resolve();
            var idList = [];
            for (var i = 0; i < 10; i++) {
                promise = promise.then(function () {
                    return Promise.all([
                        flakeIdGenerator.newId().then(addToListFunction(idList)),
                        flakeIdGenerator.newId().then(addToListFunction(idList)),
                        flakeIdGenerator.newId().then(addToListFunction(idList)),
                        flakeIdGenerator.newId().then(addToListFunction(idList)),
                        flakeIdGenerator.newId().then(addToListFunction(idList))
                    ]);
                });
            }
            return promise.then(function () {
                expect(idList.length).to.be.equal(50);
                idList.sort(function (a, b) {
                    return (a.greaterThan(b) ? 1 : (a.lessThan(b) ? -1 : 0));
                });
                for (var i = 1; i < idList.length; i++) {
                    expect(idList[i]).to.be.instanceOf(Long);
                    expect(idList[i - 1].equals(idList[i]), 'Expected ' + idList[i - 1] + ' ' + idList[i] + 'to be different.').to.be.false;
                }
            });
        });
    });

    it('subsequent ids are from the same batch', function () {
        var firstId;
        return client.getFlakeIdGenerator('test').then(function (idGenerator) {
            flakeIdGenerator = idGenerator;
            return flakeIdGenerator.newId()
        }).then(function (id) {
            firstId = id;
            return flakeIdGenerator.newId();
        }).then(function (secondId) {
            return expect(secondId.equals(firstId.add(FLAKE_ID_STEP))).to.be.true;
        });
    });

    it('ids are from new batch after validity period', function () {
        var firstId;
        return client.getFlakeIdGenerator('shortterm').then(function (idGenerator) {
            flakeIdGenerator = idGenerator;
            return flakeIdGenerator.newId()
        }).then(function (id) {
            firstId = id;
            return Util.promiseWaitMilliseconds(SHORT_TERM_VALIDITY_MILLIS + 1000);
        }).then(function () {
            return flakeIdGenerator.newId();
        }).then(function (secondId) {
            var borderId = firstId.add(FLAKE_ID_STEP * SHORT_TERM_BATCH_SIZE);
            return expect(secondId.greaterThan(borderId), 'Expected ' + secondId + ' to be greater than ' + borderId).to.be.true;
        });
    });

    it('ids are from new batch after prefetched ones are exhausted', function () {
        var firstId;
        return client.getFlakeIdGenerator('shortterm').then(function (idGenerator) {
            flakeIdGenerator = idGenerator;
            return flakeIdGenerator.newId()
        }).then(function (id) {
            firstId = id;
            return flakeIdGenerator.newId();
        }).then(function () {
            //after this we exhausted the batch at hand
            return flakeIdGenerator.newId();
        }).then(function () {
            return Util.promiseWaitMilliseconds(100);
        }).then(function () {
            return flakeIdGenerator.newId();
        }).then(function (secondId) {
            var borderId = firstId.add(FLAKE_ID_STEP * SHORT_TERM_BATCH_SIZE);
            return expect(secondId.greaterThan(borderId), 'Expected ' + secondId + ' to be greater than ' + borderId).to.be.true;
        });
        ;
    });
});
