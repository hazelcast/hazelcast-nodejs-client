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

const Client = require('../../../').Client;
const RC = require('../../RC');
const chai = require('chai');
const expect = chai.expect;

describe('RepairingTask', function () {

    let cluster;
    let client;

    before(function () {
        return RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        });
    });

    afterEach(function () {
        if (client != null) {
            client.shutdown();
        }
    });

    after(function () {
        return RC.terminateCluster(cluster.id);
    });

    function startClientWithReconciliationInterval(interval) {
        return Client.newHazelcastClient({
            clusterName: cluster.id,
            nearCaches: {
                'test': {}
            },
            properties: {
                'hazelcast.invalidation.reconciliation.interval.seconds': interval
            }
        }).then(function (cl) {
            client = cl;
        });
    }

    it('throws when reconciliation interval is set to below 30 seconds', function () {
        return startClientWithReconciliationInterval(2).then(function () {
            return expect(client.getRepairingTask.bind(client)).to.throw();
        });
    });

    it('reconciliation interval is used when set to 50', function () {
        return startClientWithReconciliationInterval(50).then(function () {
            return expect(client.getRepairingTask().reconcilliationInterval).to.equal(50000);
        });
    });

    it('no reconciliation task is run when interval is set to 0', function () {
        return startClientWithReconciliationInterval(0).then(function () {
            return expect(client.getRepairingTask().antientropyTaskHandle).to.be.undefined;
        });
    });
});
