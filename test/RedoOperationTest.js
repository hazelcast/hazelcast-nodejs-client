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

var Controller = require('./RC');
var expect = require('chai').expect;
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;

describe('Redo Operation Test: ', function () {
    var cluster;
    var config;
    var client;
    before(function () {
        return Controller.createCluster(null, null).then(function (res) {
            cluster = res;
            config = new Config.ClientConfig();
        });
    });

    afterEach(function () {
        return client.shutdown();
    });

    after(function () {
        Controller.shutdownCluster(cluster.id);
    });


    it('redoOperation true, map.put operations are retried', function () {
        this.timeout(30000);
        var member1, member2;
        var map;
        config.networkConfig.redoOperation = true;
        var testSequence = Controller.startMember(cluster.id).then(function (member) {
            member1 = member;
            return Controller.startMember(cluster.id);
        }).then(function (member) {
            member2 = member;
            return HazelcastClient.newHazelcastClient(config);
        }).then(function (cl) {
            client = cl;
            map = client.getMap('m');
        });

        let expected = 1000;

        testSequence = testSequence.then(function () {
            Controller.shutdownMember(cluster.id, member1.uuid);
            return map.put(0, 'item' + 0);
        });
        for (let i = 1; i < expected; i++) {
            testSequence = testSequence.then(function () {
                return map.put(i, 'item' + i);
            });
        }

        testSequence.then(function () {
            return map.size();
        }).then(function (size) {
            return expect(size).to.equal(expected);
        });

        return testSequence;
    });

    it('redoOperation false, map.put operations are not retried', function (done) {
        this.timeout(30000);
        var member1, member2;
        var map;
        config.networkConfig.redoOperation = false;
        var testSequence = Controller.startMember(cluster.id).then(function (member) {
            member1 = member;
            return Controller.startMember(cluster.id);
        }).then(function (member) {
            member2 = member;
            return HazelcastClient.newHazelcastClient(config);
        }).then(function (cl) {
            client = cl;
            map = client.getMap('m');
        });
        
        let expected = 1000;

        testSequence = testSequence.then(function () {
            Controller.shutdownMember(cluster.id, member1.uuid);
            return map.put(0, 'item' + 0);
        });
        for (let i = 1; i < expected; i++) {
            testSequence = testSequence.then(function () {
                return map.put(i, 'item' + i);
            });
        }

        testSequence.then(function () {
            return map.size();
        }).then(function (size) {
            if (size === expected) {
                done("Messages have been retried");
            } else {
                done();
            }
        }).catch(function () {
            done();
        });
    });
});
