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
const expect = require('chai').expect;
const RC = require('../RC');
const Client = require('../../').Client;
const Errors = require('../..').HazelcastErrors;
const fs = require('fs');
const path = require('path');

describe('PNCounterConsistencyTest', function () {

    let cluster;
    let client;

    beforeEach(function () {
        this.timeout(10000);
        return RC.createCluster(null, fs.readFileSync(path.resolve(__dirname, 'hazelcast_crdtreplication_delayed.xml'), 'utf8'))
            .then(function (cl) {
                cluster = cl;
                return RC.startMember(cluster.id);
            })
            .then(function () {
                return RC.startMember(cluster.id);
            })
            .then(function () {
                return Client.newHazelcastClient({ clusterName: cluster.id });
            })
            .then(function (value) {
                client = value;
            });
    });

    afterEach(function () {
        this.timeout(10000);
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('target replica killed, no replica is sufficiently up-to-date, get operation throws ConsistencyLostError', function () {
        let pnCounter;
        return client.getPNCounter('pncounter').then(function (counter) {
            pnCounter = counter;
            return pnCounter.getAndAdd(3)
        }).then(function () {
            const currentReplicaAddress = pnCounter.currentTargetReplicaAddress;
            return RC.terminateMember(cluster.id, currentReplicaAddress.uuid.toString());
        }).then(function () {
            return expect(pnCounter.addAndGet(10)).to.be.rejectedWith(Errors.ConsistencyLostError);
        });
    });

    it('target replica killed, no replica is sufficiently up-to-date, get operation may proceed after calling reset', function () {
        let pnCounter;
        return client.getPNCounter('pncounter').then(function (counter) {
            pnCounter = counter;
            return pnCounter.getAndAdd(3);
        }).then(function () {
            const currentReplicaAddress = pnCounter.currentTargetReplicaAddress;
            return RC.terminateMember(cluster.id, currentReplicaAddress.uuid.toString());
        }).then(function () {
            return pnCounter.reset();
        }).then(function () {
            return pnCounter.addAndGet(10);
        });
    })
});
