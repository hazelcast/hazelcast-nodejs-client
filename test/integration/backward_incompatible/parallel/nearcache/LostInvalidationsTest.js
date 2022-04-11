/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const fs = require('fs');
const RC = require('../../../RC');
const { deferredPromise } = require('../../../../../lib/util/Util');
const TestUtil = require('../../../../TestUtil');

describe('LostInvalidationTest', function () {
    const mapName = 'ncmap';
    const testFactory = new TestUtil.TestFactory();

    let cluster;
    let client;
    let member;
    let modifyingClient;

    function blockInvalidationEvents(client, nearCachedMap, notifyAfterNumberOfEvents) {
        const listenerId = nearCachedMap.invalidationListenerId;
        const connectionRegistration = client.getListenerService().registrations
            .get(listenerId).connectionRegistrations.get(client.connectionRegistry.getRandomConnection());
        const correlationId = connectionRegistration.correlationId;

        let invocation;
        if (TestUtil.isClientVersionAtLeast('5.1')) {
            invocation = client.getInvocationService().invocationsWithEventHandlers.get(correlationId);
        } else {
            invocation = client.getInvocationService().eventHandlers.get(correlationId);
        }

        const handler = invocation.handler;
        const deferred = deferredPromise();
        let numberOfBlockedInvalidations = 0;

        invocation.eventHandler = () => {
            numberOfBlockedInvalidations++;
            if (notifyAfterNumberOfEvents !== undefined && notifyAfterNumberOfEvents === numberOfBlockedInvalidations) {
                deferred.resolve();
            }
        };
        return {
            handler,
            correlationId,
            notificationPromise: deferred.promise
        };
    }

    function unblockInvalidationEvents(client, metadata) {
        let invocation;
        if (TestUtil.isClientVersionAtLeast('5.1')) {
            invocation = client.getInvocationService().invocationsWithEventHandlers.get(metadata.correlationId);
        } else {
            invocation = client.getInvocationService().eventHandlers.get(metadata.correlationId);
        }
        invocation.eventHandler = metadata.handler;
    }

    before(async function () {
        cluster = await testFactory.createClusterForParallelTests(null,
            fs.readFileSync(__dirname + '/hazelcast_eventual_nearcache.xml', 'utf8'));
        member = await RC.startMember(cluster.id);
    });

    beforeEach(async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            nearCaches: {
                [mapName]: {}
            },
            properties: {
                'hazelcast.invalidation.reconciliation.interval.seconds': 1,
                'hazelcast.invalidation.min.reconciliation.interval.seconds': 1,
                'hazelcast.invalidation.max.tolerated.miss.count': 2
            }
        }, member);
        modifyingClient = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id
        }, member);
    });

    afterEach(async function () {
        await client.shutdown();
        await modifyingClient.shutdown();
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('client eventually receives an update for which the invalidation event was dropped', async function () {
        const key = 'key';
        const value = 'val';
        const updatedval = 'updatedval';

        const map = await client.getMap(mapName);
        // Wait for the near cache to be ready. This also means that invalidation listener is registered.
        await map.nearCache.ready.promise;
        // One event comes after the first put and the other comes after the second put of the modifying client.
        const invalidationHandlerStub = blockInvalidationEvents(client, map, 2);
        const mp = await modifyingClient.getMap(mapName);
        await mp.put(key, value);
        await map.get(key);
        await mp.put(key, updatedval);
        // Wait till invalidation events to come.
        await invalidationHandlerStub.notificationPromise;
        unblockInvalidationEvents(client, invalidationHandlerStub);
        await TestUtil.assertTrueEventually(async () => {
            const result = await map.get(key);
            expect(result).to.equal(updatedval);
        });
    });

    it('lost invalidation stress test', async function () {
        const entryCount = 1000;
        const map = await client.getMap(mapName);
        // Wait for the near cache to be ready. This also means that invalidation listener is registered.
        await map.nearCache.ready.promise;
        // 1000 event comes after the first putAll and the other 1000 comes after the second putAll of the modifying client.
        const invalidationHandlerStub = blockInvalidationEvents(client, map, 2000);
        let entries = [];
        for (let i = 0; i < entryCount; i++) {
            entries.push([i, i]);
        }
        const mp = await modifyingClient.getMap(mapName);
        await mp.putAll(entries);
        const requestedKeys = [];
        for (let i = 0; i < entryCount; i++) {
            requestedKeys.push(i);
        }
        // populate near cache
        await map.getAll(requestedKeys);
        entries = [];
        for (let i = 0; i < entryCount; i++) {
            entries.push([i, i + entryCount]);
        }
        await mp.putAll(entries);
        await invalidationHandlerStub.notificationPromise;
        unblockInvalidationEvents(client, invalidationHandlerStub);
        await TestUtil.assertTrueEventually(async () => {
            for (let i = 0; i < entryCount; i++) {
                const val = await map.get(i);
                expect(val).to.equal(i + entryCount);
            }
        });
    });
});
