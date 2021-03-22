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
const { Musician, MusicianSerializer } = require('./Musician');

describe('CustomSerializerConfigTest', function () {

    let cluster;
    let client;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        return RC.startMember(cluster.id);
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    function createConfig(clusterName) {
        return {
            clusterName,
            serialization: {
                customSerializers: [new MusicianSerializer()]
            }
        };
    }

    it('should be configured programmatically', async function () {
        const musician = new Musician('Furkan');
        client = await Client.newHazelcastClient(createConfig(cluster.id));
        expect(client.getSerializationService().findSerializerFor(musician).id).to.be.equal(10);
        const map = await client.getMap('musicians');
        await map.put('neyzen', musician);
        const res = await map.get('neyzen');
        expect(res.name).to.be.equal('Furkan');
    });
});
