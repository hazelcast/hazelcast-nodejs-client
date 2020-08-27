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
const Client = require('../../.').Client;
const RC = require('./../RC');
const HazelcastJsonValue = require('../../.').HazelcastJsonValue;
const JsonStringDeserializationPolicy = require('../../.').JsonStringDeserializationPolicy;

describe('HazelcastJsonValue with HazelcastJsonValueSerializer', function () {

    let cluster, client;
    let map;
    const object = { 'a': 1 };
    const hzJsonValue = new HazelcastJsonValue(JSON.stringify(object));

    before(function () {
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                serialization: {
                    jsonStringDeserializationPolicy: JsonStringDeserializationPolicy.NO_DESERIALIZATION
                }
            }).then(function (hazelcastClient) {
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
        return client.shutdown()
            .then(() => RC.terminateCluster(cluster.id));
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
        const invalidString = '{a}';
        const hzJsonValueInvalid = new HazelcastJsonValue(invalidString);
        return map.put(1, hzJsonValueInvalid).then(function () {
            return map.get(1);
        }).then(function (value) {
            expect(value).to.be.an.instanceof(HazelcastJsonValue);
            expect(value).to.be.deep.equal(hzJsonValueInvalid);
            expect(() => JSON.parse(value.toString())).to.throw(SyntaxError);
        });
    });
});
