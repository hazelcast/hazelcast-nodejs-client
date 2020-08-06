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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const HazelcastClient = require('../../.').Client;
const Errors = require('../../.').HazelcastErrors;
const RC = require('./../RC');
const Util = require('../Util');

describe("FlakeIdGeneratorOutOfRangeTest", function () {

    let cluster, client;
    let flakeIdGenerator;

    afterEach(function () {
        return flakeIdGenerator.destroy().then(function () {
            client.shutdown();
            return RC.terminateCluster(cluster.id);
        });
    });

    function assignOverflowedNodeId(clusterId, instanceNum) {
        const script =
            'function assignOverflowedNodeId() {' +
            '   instance_' + instanceNum + '.getCluster().getLocalMember().setMemberListJoinVersion(100000);' +
            '   return instance_' + instanceNum + '.getCluster().getLocalMember().getMemberListJoinVersion();' +
            '}' +
            'result=""+assignOverflowedNodeId();';
        return RC.executeOnController(clusterId, script, 1);
    }

    for (let repeat = 0; repeat < 10; repeat++) {
        it('newId succeeds as long as there is one suitable member in the cluster (repeat: ' + repeat + '/10)', function () {
            this.timeout(30000);
            return RC.createCluster().then(function (response) {
                cluster = response;
                return RC.startMember(cluster.id);
            }).then(function () {
                return RC.startMember(cluster.id);
            }).then(function () {
                return assignOverflowedNodeId(cluster.id, Util.getRandomInt(0, 2));
            }).then(function () {
                return HazelcastClient.newHazelcastClient({
                    clusterName: cluster.id,
                    network: {
                        smartRouting: false
                    }
                });
            }).then(function (value) {
                client = value;
                return client.getFlakeIdGenerator('test');
            }).then(function (idGenerator) {
                flakeIdGenerator = idGenerator;
                let promise = Promise.resolve();
                for (let i = 0; i < 100; i++) {
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
        return RC.createCluster().then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            return assignOverflowedNodeId(cluster.id, 0);
        }).then(function () {
            return assignOverflowedNodeId(cluster.id, 1);
        }).then(function () {
            return HazelcastClient.newHazelcastClient({
                clusterName: cluster.id
            });
        }).then(function (cl) {
            client = cl;
            return client.getFlakeIdGenerator('test');
        }).then(function (idGenerator) {
            flakeIdGenerator = idGenerator;
            return expect(flakeIdGenerator.newId(flakeIdGenerator)).to.be.rejectedWith(Errors.HazelcastError);
        });
    });
});
