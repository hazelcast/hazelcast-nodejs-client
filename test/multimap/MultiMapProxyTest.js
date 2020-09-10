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

const { expect } = require('chai');
const RC = require('./../RC');
const { Client } = require('../..');
const Util = require('../Util');

describe('MultiMapProxyTest', function () {

    let cluster;
    let client;
    let map;

    before(function () {
        this.timeout(10000);
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient({
                clusterName: cluster.id
            });
        }).then(function (hazelcastClient) {
            client = hazelcastClient;
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
        return client.shutdown()
            .then(() => RC.terminateCluster(cluster.id));
    });

    it('adds and retrieves a single item', function () {
        return map.put(1, 1).then(function () {
            return map.get(1);
        }).then(function (values) {
            expect(values.toArray()).to.deep.equal([1]);
        });
    });

    it('adds and retrieves multiple items', function () {
        return map.put(1, 1).then(function () {
            return map.put(1, 2);
        }).then(function () {
            return map.get(1);
        }).then(function (values) {
            expect(values.toArray().sort()).to.deep.equal([1, 2]);
        });
    });

    it('reports change after put', function () {
        return map.put(1, 1).then(function () {
            return map.put(1, 2);
        }).then(function (changed) {
            expect(changed).to.be.true;
        });
    });

    it('reports no change after put', function () {
        return map.put(1, 1).then(function () {
            return map.put(1, 1);
        }).then(function (changed) {
            expect(changed).to.be.false;
        });
    });

    it('adds and removes a single entry', function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(1, 5)];
        return Promise.all(puts).then(function () {
            return map.remove(1, 3);
        }).then(function () {
            return map.get(1)
        }).then(function (values) {
            expect(values.toArray().sort()).to.deep.equal([1, 5])
        });
    });

    it('reports change after remove', function () {
        return map.put(1, 1).then(function () {
            return map.remove(1, 1);
        }).then(function (removed) {
            expect(removed).to.be.true;
        });
    });

    it('reports no change after remove', function () {
        return map.put(1, 1).then(function () {
            return map.remove(1, 2);
        }).then(function (removed) {
            expect(removed).to.be.false;
        });
    });

    it('removes all values from key', function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(1, 5)];
        return Promise.all(puts).then(function () {
            return map.removeAll(1);
        }).then(function (oldValues) {
            expect(oldValues.toArray().sort()).to.deep.equal([1, 3, 5]);
            return map.get(1)
        }).then(function (values) {
            expect(values.toArray()).to.be.empty;
        });
    });

    it('returns a key set', function () {
        const puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.keySet();
        }).then(function (keySet) {
            expect(keySet.sort()).to.deep.equal([1, 2, 3]);
        });
    });

    it('returns all values', function () {
        const puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.values();
        }).then(function (values) {
            expect(values.toArray().sort()).to.deep.equal([1, 3, 5]);
        });
    });

    it('returns entry set', function () {
        const puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.entrySet();
        }).then(function (entrySet) {
            const initialValue = {};
            const entries = entrySet.reduce(function (obj, tuple) {
                obj[tuple[0]] = tuple[1];
                return obj;
            }, initialValue);
            const expected = {
                1: 1,
                2: 3,
                3: 5
            };
            expect(entries).to.deep.equal(expected);
        });
    });

    it('contains a key', function () {
        return map.put(1, 1).then(function () {
            return map.containsKey(1);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it('does not contain a key', function () {
        return map.put(1, 1).then(function () {
            return map.containsKey(4);
        }).then(function (contains) {
            expect(contains).to.be.false;
        });
    });

    it('contains a value', function () {
        const puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.containsValue(3);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it('contains an entry', function () {
        const puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.containsEntry(1, 3);
        }).then(function (contains) {
            expect(contains).to.be.true;
        });
    });

    it('does not contain an entry', function () {
        const puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.containsEntry(1, 5);
        }).then(function (contains) {
            expect(contains).to.be.false;
        });
    });

    it('returns correct size', function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.size();
        }).then(function (size) {
            expect(size).to.equal(3);
        });
    });

    it('returns correct value count', function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.valueCount(1);
        }).then(function (valueCount) {
            expect(valueCount).to.equal(2);
        });
    });

    it('clears', function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        return Promise.all(puts).then(function () {
            return map.clear();
        }).then(function () {
            return map.size();
        }).then(function (size) {
            expect(size).to.equal(0);
        });
    });

    it('putAll with empty pairs', function () {
        return map.putAll([])
            .then(() => map.size())
            .then(size => expect(size).to.equal(0));
    });

    it('putAll', function () {
        Util.markServerVersionAtLeast(this, client, '4.1');
        const pairs = [["a", [1]], ["b", [2, 22]], ["c", [3, 33, 333]]];
        const checkValues = (expected, actual) => {
            expect(actual.length).to.equal(expected.length);
            expect(actual).to.have.members(expected);
        }

        return map.putAll(pairs)
            .then(() => map.get("a"))
            .then(values => {
                checkValues([1], values.toArray());
                return map.get("b");
            })
            .then(values => {
                checkValues([2, 22], values.toArray())
                return map.get("c");
            })
            .then(values => {
                checkValues([3, 33, 333], values.toArray());
            })
    });
});
