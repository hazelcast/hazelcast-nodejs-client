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

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = require('chai').expect;
var RC = require('../RC');
var Client = require('../../').Client;
const Config = require('../../').Config;
var Errors = require('../..').HazelcastErrors;
var fs = require('fs');
var path = require('path');

describe('PNCounterConsistencyTest', function () {

    var cluster;
    var client;

    beforeEach(function () {
        this.timeout(10000);
        return RC.createCluster(null, fs.readFileSync(path.resolve(__dirname, 'hazelcast_crdtreplication_delayed.xml'), 'utf8')).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            const cfg = new Config.ClientConfig();
            cfg.clusterName = cluster.id;
            return Client.newHazelcastClient(cfg);
        }).then(function (value) {
            client = value;
        });
    });

    afterEach(function () {
        this.timeout(10000);
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('target replica killed, no replica is sufficiently up-to-date, get operation throws ConsistencyLostError', function () {
        var pncounter;
        return client.getPNCounter('pncounter').then(function (counter) {
            pncounter = counter;
            return pncounter.getAndAdd(3)
        }).then(function () {
            var currentReplicaAddress = pncounter.currentTargetReplicaAddress;
            return RC.terminateMember(cluster.id, currentReplicaAddress.uuid.toString());
        }).then(function () {
            return expect(pncounter.addAndGet(10)).to.be.rejectedWith(Errors.ConsistencyLostError);
        });
    });

    it('target replica killed, no replica is sufficiently up-to-date, get operation may proceed after calling reset', function () {
        var pncounter;
        return client.getPNCounter('pncounter').then(function (counter) {
            pncounter = counter;
            return pncounter.getAndAdd(3);
        }).then(function () {
            var currentReplicaAddress = pncounter.currentTargetReplicaAddress;
            return RC.terminateMember(cluster.id, currentReplicaAddress.uuid.toString());
        }).then(function () {
            return pncounter.reset();
        }).then(function () {
            return pncounter.addAndGet(10);
        });
    })
});
