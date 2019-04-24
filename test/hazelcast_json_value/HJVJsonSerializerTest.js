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

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = require('chai').expect;
var Client = require('../../.').Client;
var RC = require('./../RC');
var Predicates = require('../../.').Predicates;
var HazelcastJsonValue = require('../../.').HazelcastJsonValue;
var Util = require('../Util');

describe('HazelcastJsonValue with JsonSerializer', function () {
    var cluster;
    var client;
    var map;
    var object = { 'a': 1 };
    var hzJsonValue = new HazelcastJsonValue(JSON.stringify(object));

    before(function () {
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        return client.getMap('jsonTest').then(function (mp) {
            map = mp;
        });
    });

    afterEach(function () {
        return map.destroy();
    });

    after(function () {
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('storing JavaScript objects', function () {
        return map.put(1, object).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.deep.equal(object);
        });
    });

    it('storing HazelcastJsonValue objects', function () {
        return map.put(1, hzJsonValue).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.deep.equal(object);
        });
    });

    it('storing invalid Json strings', function () {
        var invalidString = '{a}';
        return map.put(1, new HazelcastJsonValue(invalidString)).then(function () {
            return expect(map.get(1)).to.be.rejectedWith(SyntaxError);
        });
    });

    it('storing JavaScript and HazelcastJsonValue objects as keys', function () {
        return map.put(object, 1).then(function () {
            return map.get(object);
        }).then(function (value) {
            expect(value).to.equal(1);
            return map.put(hzJsonValue, 2);
        }).then(function () {
            return map.get(hzJsonValue);
        }).then(function (value) {
            expect(value).to.equal(2);
            return map.size();
        }).then(function (size) {
            expect(size).to.equal(1);
        });
    });
    
    it('storing JavaScript and HazelcastJsonValue objects together', function () {
        return map.put(1, object).then(function () {
            return map.put(2, hzJsonValue);
        }).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.deep.equal(object);
            return map.get(2);
        }).then(function (value) {
            expect(value).to.deep.equal(object);
        });
    });
});

describe('Querying with HazelcastJsonValue', function () {
    var cluster;
    var client;
    var map;
    var object = { 'a': 1 };

    before(function () {
        Util.markServerVersionAtLeast(this, null, '3.12');
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        return client.getMap('jsonTest').then(function (mp) {
            map = mp;
        });
    });

    afterEach(function () {
        return map.destroy();
    });

    after(function () {
        if (!client) {
            return;
        }
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });


    it('querying over JavaScript objects', function () {
        var objects = [
            [0, {'a': 1}],
            [1, {'a': 3}]
        ];
        return map.putAll(objects).then(function () {
            return map.valuesWithPredicate(Predicates.greaterThan('a', 2));
        }).then(function (values) {
            expect(values.toArray()).to.deep.equal([objects[1][1]]);
        });
    });

    it('querying over nested attributes', function () {
        var objects = [
            [0, {'a': 1, 'b': {'c': 1}}],
            [1, {'a': 3, 'b': {'c': 3}}]
        ];
        return map.putAll(objects).then(function () {
            return map.valuesWithPredicate(Predicates.greaterThan('b.c', 2));
        }).then(function (values) {
            expect(values.toArray()).to.deep.equal([objects[1][1]]);
        });
    });

    it('querying over keys', function () {
        var hzJsonValue2 = new HazelcastJsonValue('{ "a": 3 }');
        return map.put(object, 1).then(function () {
            return map.put(hzJsonValue2, 2);
        }).then(function () {
            return map.valuesWithPredicate(Predicates.sql('__key.a > 2'));
        }).then(function (values) {
            expect(values.toArray()).to.deep.equal([2]);
        });
    });

    it('querying nested attributes over keys', function () {
        var object1 = {'a': 1, 'b': {'c': 1}};
        var object2 = {'a': 1, 'b': {'c': 3}};
        return map.put(object1, 1).then(function () {
            return map.put(object2, 2);
        }).then(function () {
            return map.keySetWithPredicate(Predicates.equal('__key.b.c', 3));
        }).then(function (keySet) {
            expect(keySet).to.deep.equal([object2]);
        });
    });
});
