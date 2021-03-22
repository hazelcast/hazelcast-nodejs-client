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
const { myPortableFactory, Foo } = require('./Foo');
const { myIdentifiedFactory, Address } = require('./Address');

describe('FactoriesTest', function () {

    let cluster;
    let client;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        return RC.startMember(cluster.id);
    });

    after(async function () {
        return RC.terminateCluster(cluster.id);
    });

    afterEach(async function () {
        if (client != null) {
            return client.shutdown();
        }
    });

    function createConfig(clusterName) {
        return {
            clusterName,
            serialization: {
                dataSerializableFactories: {
                    1: myIdentifiedFactory
                },
                portableFactories: {
                    1: myPortableFactory
                }
            }
        };
    }

    it('should be configured programmatically', async function () {
        client = await Client.newHazelcastClient(createConfig(cluster.id));
        const map = await client.getMap('furkan');
        await map.put('foo', new Foo('elma'));
        await map.put('address', new Address('Sahibiata', 42000, 'Konya', 'Turkey'));
        let res = await map.get('foo');
        expect(res.foo).to.be.equal('elma');
        res = await map.get('address');
        expect(res.street).to.be.equal('Sahibiata');
        expect(res.zipCode).to.be.equal(42000);
        expect(res.city).to.be.equal('Konya');
        expect(res.state).to.be.equal('Turkey');
    });
});
