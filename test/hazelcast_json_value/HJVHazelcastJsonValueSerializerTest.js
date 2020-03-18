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

var expect = require('chai').expect;
var Client = require('../../.').Client;
var Config = require('../../.').Config.ClientConfig;
var RC = require('./../RC');
var HazelcastJsonValue = require('../../.').HazelcastJsonValue;
var JsonStringDeserializationPolicy = require('../../.').JsonStringDeserializationPolicy;

describe('HazelcastJsonValue with HazelcastJsonValueSerializer', function () {
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
            var config = new Config();
            config.serializationConfig
                .jsonStringDeserializationPolicy = JsonStringDeserializationPolicy.NO_DESERIALIZATION;
            return Client.newHazelcastClient(config).then(function (hazelcastClient) {
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
            expect(value).to.be.an.instanceof(HazelcastJsonValue);
            expect(value).to.be.deep.equal(hzJsonValue);
            expect(JSON.parse(value.toString())).to.deep.equal(object);
        });
    });

    it('storing HazelcastJsonValue objects', function () {
        return map.put(1, hzJsonValue).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.be.an.instanceof(HazelcastJsonValue);
            expect(value).to.be.deep.equal(hzJsonValue);
            expect(JSON.parse(value.toString())).to.deep.equal(object);
        });
    });

    it('storing invalid Json strings', function () {
        var invalidString = '{a}';
        var hzJsonValueInvalid = new HazelcastJsonValue(invalidString);
        return map.put(1, hzJsonValueInvalid).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.be.an.instanceof(HazelcastJsonValue);
            expect(value).to.be.deep.equal(hzJsonValueInvalid);
            expect(function () {
                JSON.parse(value.toString())
            }).to.throw(SyntaxError);
        });
    });
});
