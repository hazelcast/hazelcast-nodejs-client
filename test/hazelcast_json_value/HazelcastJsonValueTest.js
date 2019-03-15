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
var assert = require('assert');
var HazelcastClient = require('../../.').Client;
var Config = require('../../.').Config;
var RC = require('./../RC');
var Predicates = require('../../.').Predicates;
var HazelcastJsonValue = require('../../.').HazelcastJsonValue;

describe('HazelcastJsonTest', function () {
    var cluster;
    var map;
    var object = {'a': 1};
    var hzJsonValue = new HazelcastJsonValue(object);

    before(function () {
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        });
    });

    after(function () {
        return RC.shutdownCluster(cluster.id);
    });

    it('Constructing HazelcastJsonValue with null', function () {
        expect(function () {
            new HazelcastJsonValue(null);
        }).to.throw(assert.AssertionError);
    });

    it('Storing JavaScript objects with JsonSerializer', function () {
        return HazelcastClient.newHazelcastClient().then(function (client) {
            return client.getMap('jsonTest').then(function (mp) {
                map = mp;
                return map.put(1, object);
            }).then(function () {
                return map.get(1);
            }).then(function (value) {
                expect(value).to.deep.equal(object);
                return map.destroy();
            }).then(function () {
                return client.shutdown();
            });
        });
    });

    it('Storing HazelcastJsonValue objects with JsonSerializer', function () {
        return HazelcastClient.newHazelcastClient().then(function (client) {
            return client.getMap('jsonTest').then(function (mp) {
                map = mp;
                return map.put(1, hzJsonValue);
            }).then(function () {
                return map.get(1);
            }).then(function (value) {
                expect(value).to.deep.equal(object);
                return map.destroy();
            }).then(function () {
                return client.shutdown();
            });
        });
    });

    it('Storing invalid Json strings with JsonSerializer', function () {
        var invalidString = '{a}';
        return HazelcastClient.newHazelcastClient().then(function (client) {
            return client.getMap('jsonTest').then(function (mp) {
                map = mp;
                return map.put(1, new HazelcastJsonValue(invalidString));
            }).then(function () {
                return expect(map.get(1)).to.be.rejectedWith(SyntaxError);
            }).then(function () {
                return map.destroy();
            }).then(function () {
                return client.shutdown();
            });
        });
    });

    it('Storing JavaScript objects with HazelcastJsonValueSerializer', function () {
        var config = new Config.ClientConfig();
        config.serializationConfig.jsonDeserializationType = Config.JsonDeserializationType.HAZELCAST_JSON_VALUE;
        return HazelcastClient.newHazelcastClient(config).then(function (client) {
            return client.getMap('jsonTest').then(function (mp) {
                map = mp;
                return map.put(1, object);
            }).then(function () {
                return map.get(1);
            }).then(function (value) {
                expect(value).to.be.an.instanceof(HazelcastJsonValue);
                expect(value).to.be.deep.equal(hzJsonValue);
                expect(value.parse()).to.deep.equal(object);
                return map.destroy();
            }).then(function () {
                return client.shutdown();
            });
        });
    });

    it('Storing HazelcastJsonValue objects with HazelcastJsonValueSerializer', function () {
        var config = new Config.ClientConfig();
        config.serializationConfig.jsonDeserializationType = Config.JsonDeserializationType.HAZELCAST_JSON_VALUE;
        return HazelcastClient.newHazelcastClient(config).then(function (client) {
            return client.getMap('jsonTest').then(function (mp) {
                map = mp;
                return map.put(1, hzJsonValue);
            }).then(function () {
                return map.get(1);
            }).then(function (value) {
                expect(value).to.be.an.instanceof(HazelcastJsonValue);
                expect(value).to.be.deep.equal(hzJsonValue);
                expect(value.parse()).to.deep.equal(object);
                return map.destroy();
            }).then(function () {
                return client.shutdown();
            });
        });
    });

    it('Storing invalid Json strings with HazelcastJsonValueSerializer', function () {
        var invalidString = '{a}';
        var hzJsonValueInvalid = new HazelcastJsonValue(invalidString);
        var config = new Config.ClientConfig();
        config.serializationConfig.jsonDeserializationType = Config.JsonDeserializationType.HAZELCAST_JSON_VALUE;
        return HazelcastClient.newHazelcastClient(config).then(function (client) {
            return client.getMap('jsonTest').then(function (mp) {
                map = mp;
                return map.put(1, hzJsonValueInvalid);
            }).then(function () {
                return map.get(1);
            }).then(function (value) {
                expect(value).to.be.an.instanceof(HazelcastJsonValue);
                expect(value).to.be.deep.equal(hzJsonValueInvalid);
                expect(value.parse.bind(value)).to.throw(SyntaxError);
                return map.destroy();
            }).then(function () {
                return client.shutdown();
            });
        });
    });

    it('Querying over JavaScript objects', function () {
        var objects = [
            [0, {'a': 1}],
            [1, {'a': 3}]
        ];
        return HazelcastClient.newHazelcastClient().then(function (client) {
            return client.getMap('jsonTest').then(function (mp) {
                map = mp;
                return map.putAll(objects);
            }).then(function () {
                return map.valuesWithPredicate(Predicates.greaterThan('a', 2));
            }).then(function (values) {
                expect(values.toArray()).to.deep.equal([objects[1][1]]);
                return map.destroy();
            }).then(function () {
                return client.shutdown();
            });
        });
    });

    it('Querying over nested attributes', function () {
        var objects = [
            [0, {'a': 1, 'b': {'c': 1}}],
            [1, {'a': 3, 'b': {'c': 3}}]
        ];
        return HazelcastClient.newHazelcastClient().then(function (client) {
            return client.getMap('jsonTest').then(function (mp) {
                map = mp;
                return map.putAll(objects);
            }).then(function () {
                return map.valuesWithPredicate(Predicates.greaterThan('b.c', 2));
            }).then(function (values) {
                expect(values.toArray()).to.deep.equal([objects[1][1]]);
                return map.destroy();
            }).then(function () {
                return client.shutdown();
            });
        });
    });
});
