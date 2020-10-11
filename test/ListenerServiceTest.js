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

const { expect } = require('chai');
const RC = require('./RC');
const { Client } = require('../.');
const Util = require('./Util');

[true, false].forEach(function (isSmartService) {
    describe('ListenerServiceTest[smart=' + isSmartService + ']', function () {
        let cluster, client;

        before(function () {
            return RC.createCluster(null, null).then(function (res) {
                cluster = res;
                return Promise.resolve(cluster.id);
            }).then(function (clusterId) {
                return RC.startMember(clusterId);
            });
        });

        beforeEach(async function () {
            client = await Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    smartRouting: isSmartService
                }
            });
        });

        afterEach(async function () {
            return client.shutdown();
        });

        after(async function () {
            return RC.terminateCluster(cluster.id);
        });

        it('listener is invoked when a new object is created', function (done) {
            let listenerId;
            client.addDistributedObjectListener(function (distributedObjectEvent) {
                expect(distributedObjectEvent.objectName).to.eq('mapToListen');
                expect(distributedObjectEvent.serviceName).to.eq('hz:impl:mapService');
                expect(distributedObjectEvent.eventType).to.eq('created');
                client.removeDistributedObjectListener(listenerId).then(function () {
                    done();
                });
            }).then(function (id) {
                listenerId = id;
                client.getMap('mapToListen');
            });
        });

        it('listener is invoked when an object is removed[smart=' + isSmartService + ']', function (done) {
            let map, listenerId;
            client.addDistributedObjectListener(function (distributedObjectEvent) {
                if (distributedObjectEvent.eventType === 'destroyed' && distributedObjectEvent.objectName === 'mapToRemove') {
                    expect(distributedObjectEvent.objectName).to.eq('mapToRemove');
                    expect(distributedObjectEvent.serviceName).to.eq('hz:impl:mapService');
                    expect(distributedObjectEvent.eventType).to.eq('destroyed');
                    client.removeDistributedObjectListener(listenerId).then(function () {
                        done();
                    });
                } else if (distributedObjectEvent.eventType === 'created' && distributedObjectEvent.objectName === 'mapToRemove') {
                    Util.promiseWaitMilliseconds(1000).then(function () {
                        map.destroy();
                    });
                }
            }).then(function (id) {
                listenerId = id;
                client.getMap('mapToRemove').then(function (mp) {
                    map = mp;
                });
            });
        });

        it('listener is not invoked when listener was already removed by user', function (done) {
            client.addDistributedObjectListener(function () {
                done(new Error('Should not have run!'));
            }).then(function (listenerId) {
                return client.removeDistributedObjectListener(listenerId);
            }).then(function () {
                return client.getMap('testMap');
            }).then(function () {
                setTimeout(done, 1000);
            });
        });
    });
});
