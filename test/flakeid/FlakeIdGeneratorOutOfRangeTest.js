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
var expect = chai.expect;
var HazelcastClient = require('../../.').Client;
var Config = require('../../.').Config;
var Err = require('../../.').HazelcastErrors;
var Controller = require('./../RC');
var Util = require('../Util');

describe("FlakeIdGeneratorOutOfRangeTest", function () {

    var cluster;
    var client;
    var flakeIdGenerator;

    before(function () {
        Util.markServerVersionAtLeast(this, null, '3.10');
    });

    afterEach(function () {
        return flakeIdGenerator.destroy().then(function () {
            client.shutdown();
            return Controller.shutdownCluster(cluster.id);
        });
    });

    function assignOverflowedNodeId(clusterId, instanceNum) {
        var script =
            'function assignOverflowedNodeId() {' +
            '   instance_' + instanceNum + '.getCluster().getLocalMember().setMemberListJoinVersion(100000);' +
            '   return instance_' + instanceNum + '.getCluster().getLocalMember().getMemberListJoinVersion();' +
            '}' +
            'result=""+assignOverflowedNodeId();';
        return Controller.executeOnController(clusterId, script, 1);
    }

    for (var repeat = 0; repeat < 10; repeat++) {
        it('newId succeeds as long as there is one suitable member in the cluster (repeat: ' + repeat + '/10)', function () {
            this.timeout(30000);
            return Controller.createCluster().then(function (response) {
                cluster = response;
                return Controller.startMember(cluster.id);
            }).then(function () {
                return Controller.startMember(cluster.id);
            }).then(function () {
                return assignOverflowedNodeId(cluster.id, Util.getRandomInt(0, 2));
            }).then(function () {
                var cfg = new Config.ClientConfig();
                cfg.networkConfig.smartRouting = false;
                return HazelcastClient.newHazelcastClient(cfg);
            }).then(function (value) {
                client = value;
                return client.getFlakeIdGenerator('test');
            }).then(function (idGenerator) {
                flakeIdGenerator = idGenerator;
                var promise = Promise.resolve();
                for (var i = 0; i < 100; i++) {
                    promise = promise.then(function () {
                        return flakeIdGenerator.newId();
                    });
                }
                return promise;
            });
        });
    }

    it('throws NodeIdOutOfRangeError when there is no server with a join id smaller than 2^16', function () {
        this.timeout(20000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return Controller.startMember(cluster.id);
        }).then(function () {
            return assignOverflowedNodeId(cluster.id, 0);
        }).then(function () {
            return assignOverflowedNodeId(cluster.id, 1);
        }).then(function () {
            return HazelcastClient.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
            return client.getFlakeIdGenerator('test');
        }).then(function (idGenerator) {
            flakeIdGenerator = idGenerator;
            return expect(flakeIdGenerator.newId(flakeIdGenerator)).to.be.rejectedWith(Err.HazelcastError);
        });
    });
});
