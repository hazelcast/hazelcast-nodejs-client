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

const { expect } = require('chai');
const fs = require('fs');
const RC = require('../RC');
const { Client } = require('../../../');
const { deferredPromise } = require('../../../lib/util/Util');
const TestUtil = require('../../TestUtil');

describe('LostInvalidationTest', function () {

    const entryCount = 1000;
    const mapName = 'ncmap';

    let cluster;
    let client;
    let modifyingClient;

    function blockInvalidationEvents(client, nearCachedMap, notifyAfterNumberOfEvents) {
        const listenerId = nearCachedMap.invalidationListenerId;
        const clientRegistrationKey = client.getListenerService().activeRegistrations
            .get(listenerId).get(client.connectionRegistry.getRandomConnection());
        const correlationId = clientRegistrationKey.correlationId;
        const handler = client.getInvocationService().eventHandlers.get(correlationId).handler;
        const deferred = deferredPromise();
        let numberOfBlockedInvalidations = 0;
        client.getInvocationService().eventHandlers.get(correlationId).handler = () => {
            numberOfBlockedInvalidations++;
            if (notifyAfterNumberOfEvents !== undefined && notifyAfterNumberOfEvents === numberOfBlockedInvalidations) {
                deferred.resolve();
            }
        };
        return {
            handler,
            correlationId,
            notificationHandler: deferred.promise
        };
    }

    function unblockInvalidationEvents(client, metadata) {
        client.getInvocationService().eventHandlers.get(metadata.correlationId).handler = metadata.handler;
    }

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_eventual_nearcache.xml', 'utf8'));
        return RC.startMember(cluster.id);
    });

    beforeEach(async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            nearCaches: {
                [mapName]: {}
            },
            properties: {
                'hazelcast.invalidation.reconciliation.interval.seconds': 1,
                'hazelcast.invalidation.min.reconciliation.interval.seconds': 1,
                'hazelcast.invalidation.max.tolerated.miss.count': 2
            }
        });
        modifyingClient = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    afterEach(async function () {
        await client.shutdown();
        await modifyingClient.shutdown();
    });

    after(async function () {
        await RC.terminateCluster(cluster.id);
    });

    it('client eventually receives an update for which the invalidation event was dropped', async function () {
        const key = 'key';
        const value = 'val';
        const updatedval = 'updatedval';

        const map = await client.getMap(mapName);
        await TestUtil.promiseWaitMilliseconds(100);
        const invalidationHandlerStub = blockInvalidationEvents(client, map, 1);
        const mp = await modifyingClient.getMap(mapName);
        await mp.put(key, value);
        await map.get(key);
        await mp.put(key, updatedval);
        await TestUtil.promiseWaitMilliseconds(1000);
        unblockInvalidationEvents(client, invalidationHandlerStub);
        await TestUtil.promiseWaitMilliseconds(1000);
        const result = await map.get(key);
        expect(result).to.equal(updatedval);
    });

    it('lost invalidation stress test', async function () {
        let val;
        const map = await client.getMap(mapName);
        await TestUtil.promiseWaitMilliseconds(100);
        const invalidationHandlerStub = blockInvalidationEvents(client, map);
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
        unblockInvalidationEvents(client, invalidationHandlerStub);
        await TestUtil.promiseWaitMilliseconds(2000);
        for (let i = 0; i < entryCount; i++) {
            val = await map.get(i);
            expect(val).to.equal(i + entryCount);
        }
    });
});
