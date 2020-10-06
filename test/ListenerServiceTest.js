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

const expect = require('chai').expect;
const RC = require('./RC');
const { Client } = require('../.');
const Util = require('./Util');

[true, false].forEach(function (isSmartService) {
    describe('ListenerServiceTest[smart=' + isSmartService + ']', function () {
        let cluster, client;

        before(async function () {
            cluster = await RC.createCluster(null, null);
            await RC.startMember(cluster.id)
        });

        beforeEach(async function () {
            client = await Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    smartRouting: isSmartService
                }
            })
        });

        afterEach(async function () {
            await client.shutdown();
        });

        after(function () {
            return RC.terminateCluster(cluster.id);
        });

        it('listener is invoked when a new object is created', async function () {
            let listenerId = await client.addDistributedObjectListener(async function (distributedObjectEvent) {
                expect(distributedObjectEvent.objectName).to.eq('mapToListen');
                expect(distributedObjectEvent.serviceName).to.eq('hz:impl:mapService');
                expect(distributedObjectEvent.eventType).to.eq('created');
                await client.removeDistributedObjectListener(listenerId);
                return;
            })
            await client.getMap('mapToListen');
        });

        it('listener is invoked when an object is removed[smart=' + isSmartService + ']', async function () {
            let map, listenerId;
            listenerId = await client.addDistributedObjectListener(async function (distributedObjectEvent) {
                if (distributedObjectEvent.eventType === 'destroyed' &&
                    distributedObjectEvent.objectName === 'mapToRemove') {
                    expect(distributedObjectEvent.objectName).to.eq('mapToRemove');
                    expect(distributedObjectEvent.serviceName).to.eq('hz:impl:mapService');
                    expect(distributedObjectEvent.eventType).to.eq('destroyed');
                    await client.removeDistributedObjectListener(listenerId);
                    return;
                } else if (distributedObjectEvent.eventType === 'created' &&
                    distributedObjectEvent.objectName === 'mapToRemove') {
                    await Util.promiseWaitMilliseconds(1000);
                    map.destroy();
                }
            })
            map = await client.getMap('mapToRemove');
        });

        it('listener is not invoked when listener was already removed by user', async function () {
            let listenerId;
            listenerId = await client.addDistributedObjectListener(function () {
                throw (new Error('Should not have run!'));
            });

            await client.removeDistributedObjectListener(listenerId)
            await client.getMap('testMap');
        });
    });
});
