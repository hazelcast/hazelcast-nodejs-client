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

const RC = require('../../RC');
const { Client } = require('../../../../');
const { SimplePortable, InnerPortable } = require('../../../unit/serialization/PortableObjects');

describe('PortableSerializersLiveTest', function () {

    let cluster;
    let client;
    let map;

    function getClientConfig(clusterName) {
        return {
            clusterName,
            serialization: {
                portableFactories: {
                    10: (classId) => {
                        if (classId === 222) {
                            return new InnerPortable();
                        } else if (classId === 21) {
                            return new SimplePortable();
                        } else {
                            return null;
                        }
                    }
                }
            }
        };
    }

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient(getClientConfig(cluster.id));
        map = await client.getMap('test');
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('client can write and read two different serializable objects of the same factory', async function () {
        const simplePortable = new SimplePortable('atext');
        const innerPortable = new InnerPortable('str1', 'str2');
        await map.put('simpleportable', simplePortable);
        await map.put('innerportable', innerPortable);

        const sp = await map.get('simpleportable');
        const ip = await map.get('innerportable');

        expect(sp).to.deep.equal(simplePortable);
        expect(ip).to.deep.equal(innerPortable);
    });

    it('client can read two different serializable objects of the same factory (written by another client)', async function () {
        const simplePortable = new SimplePortable('atext');
        const innerPortable = new InnerPortable('str1', 'str2');
        await map.putAll([
            ['simpleportable', simplePortable],
            ['innerportable', innerPortable]
        ]);
        await client.shutdown();

        client = await Client.newHazelcastClient(getClientConfig(cluster.id));
        map = await client.getMap('test');
        const sp = await map.get('simpleportable');
        const ip = await map.get('innerportable');

        expect(sp).to.deep.equal(simplePortable);
        expect(ip).to.deep.equal(innerPortable);
    });
});
