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

var expect = require('chai').expect;
var HazelcastClient = require('../../.').Client;
var RC = require('./../RC');
var Predicates = require('../../.').Predicates;
var HazelcastJson = require('../../.').HazelcastJson;


describe('HazelcastJsonTest', function () {
    var cluster;
    var client;
    var map;

    before(function () {
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient().then(function (hz) {
                client = hz;
            });
        });
    });

    beforeEach(function () {
        return client.getMap('test').then(function (mp) {
            map = mp;
        });
    });

    after(function () {
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    afterEach(function () {
       return map.destroy();
    });

    it('storing javascript objects', function () {
        var obj = {
            'a': 1
        };

        return map.put(1, obj).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.be.an.instanceOf(HazelcastJson);
            expect(value.toJsonString()).to.equal(JSON.stringify(obj));
            expect(value.parse()).to.deep.equal(obj);
        });
    });

    it('storing HazelcastJson objects', function () {
        var jsonString = '{"a": 1}';
        return map.put(1, new HazelcastJson(jsonString)).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.be.an.instanceOf(HazelcastJson);
            expect(value.toJsonString()).to.equal(jsonString);
            expect(value.parse()).to.deep.equal(JSON.parse(jsonString));
        });
    });

    it('storing invalid Json strings', function () {
        var invalidStr = '{"a: 1}';
        return map.put(1, new HazelcastJson(invalidStr)).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.be.an.instanceOf(HazelcastJson);
            expect(value.toJsonString()).to.equal(invalidStr);
            expect(value.parse.bind(value)).to.throw(SyntaxError);
        });
    });

    it('querying over javascript objects', function () {
        var obj1 = {
            'a': 1
        };

        var obj2 = {
            'a': 3
        };

        return map.put(1, obj1).then(function () {
            return map.put(2, obj2);
        }).then(function () {
            return map.valuesWithPredicate(Predicates.greaterThan('a', 2));
        }).then(function (values) {
            var valuesArr = values.toArray();
            expect(valuesArr.length).to.equal(1);
            expect(valuesArr[0]).to.be.an.instanceOf(HazelcastJson);
            expect(valuesArr[0].parse()['a']).to.equal(3);
        });
    });
    
    it('querying over HazelcastJson objects', function () {
        return map.put(1, new HazelcastJson('{"a": 1}')).then(function () {
            return map.put(2, new HazelcastJson('{"a": 3}'));
        }).then(function () {
            return map.valuesWithPredicate(Predicates.greaterThan('a', 2));
        }).then(function (values) {
            var valuesArr = values.toArray();
            expect(valuesArr.length).to.equal(1);
            expect(valuesArr[0]).to.be.an.instanceOf(HazelcastJson);
            expect(valuesArr[0].parse()['a']).to.equal(3);
        });
    });
});
