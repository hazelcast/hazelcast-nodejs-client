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

const RC = require('./RC');
const HazelcastClient = require('../.').Client;
const expect = require('chai').expect;

describe('LifecycleService', function () {

    let cluster;

    before(function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
            return RC.startMember(cluster.id);
        });
    });

    after(function () {
        return RC.terminateCluster(cluster.id);
    });

    it('client should emit STARTING, STARTED, CONNECTED, SHUTTING_DOWN, DISCONNECTED and SHUTDOWN events in order', function (done) {
        let expectedState = 'STARTING';
        const listener = (state) => {
            if (state === 'STARTING' && expectedState === 'STARTING') {
                expectedState = 'STARTED'
            } else if (state === 'STARTED' && expectedState === 'STARTED') {
                expectedState = 'CONNECTED';
            } else if (state === 'CONNECTED' && expectedState === 'CONNECTED') {
                expectedState = 'SHUTTING_DOWN';
            } else if (state === 'SHUTTING_DOWN' && expectedState === 'SHUTTING_DOWN') {
                expectedState = 'DISCONNECTED';
            } else if (state === 'DISCONNECTED' && expectedState === 'DISCONNECTED') {
                expectedState = 'SHUTDOWN';
            } else if (state === 'SHUTDOWN' && expectedState === 'SHUTDOWN') {
                done();
            } else {
                done('Got lifecycle event ' + state + ' instead of ' + expectedState);
            }
        };
        HazelcastClient.newHazelcastClient({
            clusterName: cluster.id,
            lifecycleListeners: [ listener ]
        }).then(function (client) {
            client.shutdown();
        });
    });

    it('event listener should get SHUTTING_DOWN, DISCONNECTED and SHUTDOWN events when added after startup', function (done) {
        let expectedState = 'SHUTTING_DOWN';
        HazelcastClient.newHazelcastClient({
            clusterName: cluster.id
        }).then(function (client) {
            client.lifecycleService.on('lifecycleEvent', function (state) {
                if (state === 'SHUTTING_DOWN' && expectedState === 'SHUTTING_DOWN') {
                    expectedState = 'DISCONNECTED';
                } else if (state === 'DISCONNECTED' && expectedState === 'DISCONNECTED') {
                    expectedState = 'SHUTDOWN';
                } else if (state === 'SHUTDOWN' && expectedState === 'SHUTDOWN') {
                    done();
                } else {
                    done('Got lifecycle event ' + state + ' instead of ' + expectedState);
                }
            });
            client.shutdown();
        });
    });

    it('isRunning returns correct values at lifecycle stages', function (done) {
        HazelcastClient.newHazelcastClient({
            clusterName: cluster.id
        }).then(function (client) {
            client.lifecycleService.on('lifecycleEvent',
                function (state) {
                    if (state === 'STARTING') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                    } else if (state === 'STARTED') {
                        expect(client.lifecycleService.isRunning()).to.be.true;
                    } else if (state === 'CONNECTED') {
                        expect(client.lifecycleService.isRunning()).to.be.true;
                    } else if (state === 'SHUTTING_DOWN') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                    } else if (state === 'DISCONNECTED') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                    } else if (state === 'SHUTDOWN') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                        done();
                    } else {
                        done('Got unexpected lifecycle event: ' + state);
                    }
                }
            );
            client.shutdown();
        });
    });
});
