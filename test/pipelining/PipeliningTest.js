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

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = require("chai").expect;
var Client = require("../../.").Client;
var RC = require('./../RC');
var Pipelining = require('../../.').Pipelining;
var assert = require('assert');

describe('Pipelining', function () {
    var cluster;
    var client;
    var map;
    var expected = [];
    var ITEM_COUNT = 10000;

    function fakeLoadGenerator() {
        return Promise.resolve('fake');
    }

    function createLoadGenerator(map) {
        var counter = 0;
        return function () {
            var index = counter++;
            if (index < ITEM_COUNT) {
                return map.get(index);
            }
            return null;
        }
    }

    function createLoadGeneratorWithHandler(map, actual, counterStart) {
        var counter = counterStart;
        var limit = counterStart + ITEM_COUNT;
        return function () {
            var index = counter++;
            if (index < limit) {
                return map.get(index - counterStart).then(function (value) {
                    actual[index] = value;
                });
            }
            return null;
        }
    }

    function createRejectingLoadGenerator() {
        var counter = 0;
        var promises = [
            () => Promise.resolve('foo'),
            () => Promise.reject('Error1'),
        ];
        return function () {
            var index = counter++;
            if (index < promises.length) {
                return promises[index]();
            }
            return null;
        }
    }

    before(function () {
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient();
        }).then(function (hazelcastClient) {
            client = hazelcastClient;
            return client.getMap('pipeliningTest');
        }).then(function (mp) {
            map = mp;
            var entries = [];
            for (var i = 0; i < ITEM_COUNT; i++) {
                var item = Math.random();
                expected.push(item);
                entries.push([i, item]);
            }
            return map.putAll(entries);
        });
    });

    after(function () {
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('should throw if non-positive depth is passed to constructor', function () {
        expect(function () {
            return new Pipelining(-1, fakeLoadGenerator);
        }).to.throw(assert.AssertionError);
        expect(function () {
            return new Pipelining(0, fakeLoadGenerator)
        }).to.throw(assert.AssertionError);
    });

    it('should throw if null load generator is passed to constructor', function () {
        expect(function () {
            return new Pipelining(1, null);
        }).to.throw(assert.AssertionError);
    });

    it('should return results in order when it stores results', function () {
        var pipelining = new Pipelining(100, createLoadGenerator(map), true);
        return pipelining.run().then(function (results) {
           expect(results).to.deep.equal(expected);
        });
    });

    it('should not store results by default', function () {
        var actual = [];

        var pipelining = new Pipelining(100, createLoadGeneratorWithHandler(map, actual, 0));
        return pipelining.run().then(function (results) {
            expect(results).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
        });
    });

    it('should succeed with depth 1 with storage of the results', function () {
        var pipelining = new Pipelining(1, createLoadGenerator(map), true);
        return pipelining.run().then(function (results) {
            expect(results).to.deep.equal(expected);
        })
    });

    it('should succeed with depth 1000 with storage of the results', function () {
        var pipelining = new Pipelining(1000, createLoadGenerator(map), true);
        return pipelining.run().then(function (results) {
            expect(results).to.deep.equal(expected);
        })
    });

    it('should succeed with depth 1 without storage of the results', function () {
        var actual = [];

        var pipelining = new Pipelining(1, createLoadGeneratorWithHandler(map, actual, 0));
        return pipelining.run().then(function (results) {
            expect(results).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
        })
    });

    it('should succeed with depth 1000 without storage of the results', function () {
        var actual = [];

        var pipelining = new Pipelining(1000, createLoadGeneratorWithHandler(map, actual, 0));
        return pipelining.run().then(function (results) {
            expect(results).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
        })
    });

    it('should reject if any of the requests fail without storage of the results', function () {
        var pipelining = new Pipelining(1, createRejectingLoadGenerator());
        expect(pipelining.run()).to.be.be.rejectedWith('Error1');
    });

    it('should reject if any of the requests fail with storage of the results', function () {
        var pipelining = new Pipelining(1, createRejectingLoadGenerator(), true);
        expect(pipelining.run()).to.be.be.rejectedWith('Error1');

    });

    it('should throw when null load generator is passed to setLoadGenerator', function () {
        var pipelining = new Pipelining(1, fakeLoadGenerator());
        expect(function () {
            pipelining.setLoadGenerator(null);
        }).to.throw(assert.AssertionError);
    });

    it('should run pipeline more than once without the storage of the results', function () {
        var actual = [];

        var pipelining = new Pipelining(100, createLoadGeneratorWithHandler(map, actual, 0));
        return pipelining.run().then(function () {
           pipelining.setLoadGenerator(createLoadGeneratorWithHandler(map, actual, actual.length));
           return pipelining.run();
        }).then(function (results) {
            expect(results).to.be.an('undefined');
            expect(actual.slice(0, ITEM_COUNT)).to.deep.equal(expected);
            expect(actual.slice(ITEM_COUNT)).to.deep.equal(expected);
        });
    });

    it('should run pipeline more than once with the storage of the results', function () {
        var pipelining = new Pipelining(100, createLoadGenerator(map), true);
        return pipelining.run().then(function (results) {
            expect(results).to.deep.equal(expected);
            pipelining.setLoadGenerator(createLoadGenerator(map));
            return pipelining.run();
        }).then(function (results) {
            expect(results.slice(0, ITEM_COUNT)).to.deep.equal(expected);
            expect(results.slice(ITEM_COUNT)).to.deep.equal(expected);
        });
    });

    it('should not do more operations when the load generator is exhausted without the storage of results ', function () {
        var actual = [];

        var pipelining = new Pipelining(100, createLoadGeneratorWithHandler(map, actual, 0));
        return pipelining.run().then(function (result) {
            expect(result).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
            return pipelining.run();
        }).then(function (result) {
            expect(result).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
        })
    });


    it('should not do more operations when the load generator is exhausted with the storage of results ', function () {
        var pipelining = new Pipelining(100, createLoadGenerator(map), true);
        return pipelining.run().then(function (result) {
            expect(result).to.deep.equal(expected);
            return pipelining.run();
        }).then(function (result) {
            expect(result).to.deep.equal(expected);
        })
    });

});
