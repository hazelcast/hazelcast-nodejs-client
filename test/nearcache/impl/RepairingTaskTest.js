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

var Client = require('../../../').Client;
var Config = require('../../../').Config;
var Controller = require('../../RC');
var chai = require('chai');
var expect = chai.expect;

describe('RepairingTask', function () {

    var cluster;
    var member;
    var client;

    before(function () {
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        }).then(function (me) {
            member = me;
        });
    });

    afterEach(function () {
        if (client != null) {
            client.shutdown();
        }
    });

    after(function () {
        return Controller.shutdownCluster(cluster.id);
    });

    function startClientWithReconciliationInterval(reconciliationInterval) {
        var cfg = new Config.ClientConfig();
        var nccConfig = new Config.NearCacheConfig();
        nccConfig.name = 'test';
        cfg.nearCacheConfigs['test'] = nccConfig;
        cfg.properties['hazelcast.invalidation.reconciliation.interval.seconds'] = reconciliationInterval;
        return Client.newHazelcastClient(cfg).then(function (cl) {
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
