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

var expect = require("chai").expect;
var HazelcastClient = require("../../lib/index.js").Client;
var Controller = require('./../RC');
var Util = require('./../Util');
var Promise = require('bluebird');

describe("MultiMap Proxy", function () {

    var cluster;
    var client;

    var map;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            })
        });
    });

    beforeEach(function () {
        return client.getMultiMap('test').then(function (mp) {
            map = mp;
        });
    });

    afterEach(function () {
        return map.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it("adds and retrieves a single item", function () {
        return map.put(1, 1).then(function () {
            return map.get(1);
        }).then(function (values) {
            expect(values.toArray()).to.deep.equal([1]);
        });
    });

    it("adds and retrieves multiple items", function () {
        return map.put(1, 1).then(function () {
            return map.put(1, 2);
        }).then(function () {
            return map.get(1);
        }).then(function (values) {
            expect(values.toArray().sort()).to.deep.equal([1, 2]);
        });
    });

    it("reports change after put", function () {
        return map.put(1, 1).then(function () {
            return map.put(1, 2);
        }).then(function (changed) {
            expect(changed).to.be.true;
        });
    });

    it("reports no change after put", function () {
        return map.put(1, 1).then(function () {
            return map.put(1, 1);
        }).then(function (changed) {
            expect(changed).to.be.false;
        });
    });

    it("adds and removes a single entry", function () {
        var puts = [map.put(1, 1), map.put(1, 3), map.put(1, 5)];
        return Promise.all(puts).then(function () {
            return map.remove(1, 3);
        }).then(function () {
            return map.get(1)
        }).then(function (values) {
            expect(values.toArray().sort()).to.deep.equal([1, 5])
        });
    });

    it("reports change after remove", function () {
        return map.put(1, 1).then(function () {
            return map.remove(1, 1);
        }).then(function (removed) {
            expect(removed).to.be.true;
        });
    });

    it("reports no change after remove", function () {
        return map.put(1, 1).then(function () {
            return map.remove(1, 2);
        }).then(function (removed) {
            expect(removed).to.be.false;
        });
    });

    it("removes all values from key", function () {
        var puts = [map.put(1, 1), map.put(1, 3), map.put(1, 5)];
        return Promise.all(puts).then(function () {
            return map.removeAll(1);
        }).then(function (oldValues) {
            expect(oldValues.toArray().sort()).to.deep.equal([1, 3, 5]);
            return map.get(1)
        }).then(function (values) {
            expect(values.toArray()).to.be.empty;
        });
    });

    it("returns a key set", function () {
        var puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.keySet();
        }).then(function (keySet) {
            expect(keySet.sort()).to.deep.equal([1, 2, 3]);
        });
    });

    it("returns all values", function () {
        var puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.values();
        }).then(function (values) {
            expect(values.toArray().sort()).to.deep.equal([1, 3, 5]);
        });
    });

    it("returns entry set", function () {
        var puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.entrySet();
        }).then(function (entrySet) {
            var initialValue = {};

            var entries = entrySet.reduce(function (obj, tuple) {
                obj[tuple[0]] = tuple[1];
                return obj;
            }, initialValue);

            var expected = {
                1: 1,
                2: 3,
                3: 5
            };

            expect(entries).to.deep.equal(expected);
        });
    });

    it("contains a key", function () {
        return map.put(1, 1).then(function () {
            return map.containsKey(1);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it("does not contain a key", function () {
        return map.put(1, 1).then(function () {
            return map.containsKey(4);
        }).then(function (contains) {
            expect(contains).to.be.false;
        });
    });

    it("contains a value", function () {
        var puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.containsValue(3);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it("contains an entry", function () {
        var puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.containsEntry(1, 3);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it("does not contain an entry", function () {
        var puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.containsEntry(1, 5);
        }).then(function (contains) {
            expect(contains).to.be.false;
        });
    });

    it("returns correct size", function () {
        var puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.size();
        }).then(function (size) {
            expect(size).to.equal(3);
        });
    });

    it("returns correct value count", function () {
        var puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.valueCount(1);
        }).then(function (valueCount) {
            expect(valueCount).to.equal(2);
        });
    });

    it("clears", function () {
        var puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.clear();
        }).then(function () {
            return map.size();
        }).then(function (size) {
            expect(size).to.equal(0);
        });
    });
});
