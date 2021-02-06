/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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


var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var sinon = require('sinon');
var sandbox = sinon.createSandbox();

var RC = require('./RC');
var HzErrors = require('../.').HazelcastErrors;
var Client = require('../.').Client;
var RepairingTask = require('../lib/nearcache/RepairingTask').RepairingTask;
var NearCacheManager = require('../lib/nearcache/NearCacheManager').NearCacheManager;
var Statistics = require('../lib/statistics/Statistics').Statistics;
var ClientConnectionManager = require('../lib/invocation/ClientConnectionManager').ClientConnectionManager;
var InvocationService = require('../lib/invocation/InvocationService').InvocationService;
var PartitionService = require('../lib/PartitionService').PartitionService;
var Heartbeat = require('../lib/HeartbeatService').Heartbeat;
var ListenerService = require('../lib/ListenerService').ListenerService;

describe('ClientShutdownTest', function () {

    var cluster;

    afterEach(function () {
        sandbox.restore();
        if (cluster != null) {
            RC.terminateCluster(cluster.id).then(() => {
                cluster = null;
            }).catch(err => {
                throw err;
            });
        }
    });

    it('client should call shutdown on failed start', function () {
        sandbox.spy(Client.prototype, 'shutdown');

        return expect(Client.newHazelcastClient()).to.be.rejectedWith(HzErrors.IllegalStateError).then(() => {
            expect(Client.prototype.shutdown.calledOnce).to.be.true;
        });
    });

    it('client should stop services and release resources on shutdown', function () {
        sandbox.spy(RepairingTask.prototype, 'shutdown');
        sandbox.spy(NearCacheManager.prototype, 'destroyAllNearCaches');
        sandbox.spy(Statistics.prototype, 'stop');
        sandbox.spy(PartitionService.prototype, 'shutdown');
        sandbox.spy(Heartbeat.prototype, 'cancel');
        sandbox.spy(ClientConnectionManager.prototype, 'shutdown');
        sandbox.spy(ListenerService.prototype, 'shutdown');
        sandbox.spy(InvocationService.prototype, 'shutdown');

        return RC.createCluster(null, null).then(cluster => {
            return RC.startMember(cluster.id);
        }).then(() => {
            return Client.newHazelcastClient();
        }).then(client => {
            client.getRepairingTask();
            return client.shutdown();
        }).then(() => {
            expect(RepairingTask.prototype.shutdown.calledOnce).to.be.true;
            expect(NearCacheManager.prototype.destroyAllNearCaches.calledOnce).to.be.true;
            expect(Statistics.prototype.stop.calledOnce).to.be.true;
            expect(PartitionService.prototype.shutdown.calledOnce).to.be.true;
            expect(Heartbeat.prototype.cancel.calledOnce).to.be.true;
            expect(ClientConnectionManager.prototype.shutdown.calledOnce).to.be.true;
            expect(ListenerService.prototype.shutdown.calledOnce).to.be.true;
            expect(InvocationService.prototype.shutdown.calledOnce).to.be.true;
        });
    });
});
