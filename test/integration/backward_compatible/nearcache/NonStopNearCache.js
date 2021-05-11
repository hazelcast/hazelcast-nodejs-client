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

const chai = require('chai');
chai.should();

const RC = require('../../RC');
const { Client, LifecycleState, ClientOfflineError } = require('../../../../');

const { deferredPromise } = require('../../../../lib/util/Util');

describe('NonStopNearCacheTest', function () {

    let map;
    let cluster;
    let client;

    const mapName = 'someMap';
    const ENTRY_COUNT = 100;

    beforeEach(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        const disconnectedDeferred = deferredPromise();
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            nearCaches: {
                [mapName]: {}
            },
            lifecycleListeners: [state => {
                if (state === LifecycleState.DISCONNECTED) {
                    disconnectedDeferred.resolve();
                }
            }],
            connectionStrategy: {
                reconnectMode: 'ASYNC'
            }
        });

        map = await client.getMap(mapName);

        for (let i = 0; i < ENTRY_COUNT; i++) {
            await map.put(i, i);
        }

        // Populate the near cache
        for (let i = 0; i < ENTRY_COUNT; i++) {
            await map.get(i);
        }

        await RC.shutdownCluster(cluster.id);

        await disconnectedDeferred.promise;
    });

    afterEach(async function () {
        await client.shutdown();
    });

    it('should be able to get existing keys from cache', async function () {
        // verify the near cache data available while client is disconnected
        for (let i = 0; i < 100; i++) {
            (await map.get(i)).should.be.eq(i);
        }
    });

    it('should reject with ClientOfflineError when client tries to get a non-existent key', function (done) {
        // verify that if client ask for non available key, we get offline exception immediately
        map.get(200).then(() => {
            done(new Error('expected to reject but resolved'));
        }).catch(err => {
            err.should.be.instanceof(ClientOfflineError);
            done();
        }).catch(done);
    });

    it('should reject with ClientOfflineError when client puts to map', function (done) {
        // verify that if client tries to put a map with cache when disconnected, we get offline exception immediately
        map.put(1, 2).then(() => {
            done(new Error('expected to reject but resolved'));
        }).catch(err => {
            err.should.be.instanceof(ClientOfflineError);
            done();
        }).catch(done);
    });

});
