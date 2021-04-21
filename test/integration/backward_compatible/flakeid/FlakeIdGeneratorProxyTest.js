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
const Long = require('long');

const RC = require('../../RC');
const { Client } = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('FlakeIdGeneratorProxyTest', function () {

    const FLAKE_ID_STEP = 1 << 16;
    const SHORT_TERM_BATCH_SIZE = 3;
    const SHORT_TERM_VALIDITY_MILLIS = 3000;

    let cluster;
    let client;
    let flakeIdGenerator;

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            flakeIdGenerators: {
                'shortterm': {
                    prefetchValidityMillis: SHORT_TERM_VALIDITY_MILLIS,
                    prefetchCount: SHORT_TERM_BATCH_SIZE
                }
            }
        });
    });

    afterEach(async function () {
        return flakeIdGenerator.destroy();
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    function addToListFunction(l) {
        return function (val) {
            l.push(val);
        };
    }

    it('newId succeeds', async function () {
        flakeIdGenerator = await client.getFlakeIdGenerator('test');
        return flakeIdGenerator.newId();
    });

    it('newId returns a unique long', async function () {
        flakeIdGenerator = await client.getFlakeIdGenerator('test');
        const idList = [];
        for (let i = 0; i < 50; i++) {
            addToListFunction(idList)(await flakeIdGenerator.newId());
        }
        expect(idList.length).to.be.equal(50);
        idList.sort((a, b) => {
            return (a.greaterThan(b) ? 1 : (a.lessThan(b) ? -1 : 0));
        });
        for (let i = 1; i < idList.length; i++) {
            expect(idList[i]).to.be.instanceOf(Long);
            expect(idList[i - 1].equals(idList[i]), 'Expected ' + idList[i - 1] + ' ' + idList[i] + 'to be different.')
                .to.be.false;
        }
    });

    it('subsequent ids are from the same batch', async function () {
        flakeIdGenerator = await client.getFlakeIdGenerator('test');
        const firstId = await flakeIdGenerator.newId();
        const secondId = await flakeIdGenerator.newId();
        expect(secondId.equals(firstId.add(FLAKE_ID_STEP))).to.be.true;
    });

    it('ids are from new batch after validity period', async function () {
        flakeIdGenerator = await client.getFlakeIdGenerator('shortterm');
        const firstId = await flakeIdGenerator.newId();
        await TestUtil.promiseWaitMilliseconds(SHORT_TERM_VALIDITY_MILLIS + 1000);
        const secondId = await flakeIdGenerator.newId();
        const borderId = firstId.add(FLAKE_ID_STEP * SHORT_TERM_BATCH_SIZE);
        expect(secondId.greaterThan(borderId), 'Expected ' + secondId + ' to be greater than ' + borderId)
            .to.be.true;
    });

    it('ids are from new batch after prefetched ones are exhausted', async function () {
        flakeIdGenerator = await client.getFlakeIdGenerator('shortterm');
        const firstId = await flakeIdGenerator.newId();
        await flakeIdGenerator.newId();
        // after this we exhausted the batch at hand
        await flakeIdGenerator.newId();
        await TestUtil.promiseWaitMilliseconds(100);
        const secondId = await flakeIdGenerator.newId();
        const borderId = firstId.add(FLAKE_ID_STEP * SHORT_TERM_BATCH_SIZE);
        expect(secondId.greaterThan(borderId), 'Expected ' + secondId + ' to be greater than ' + borderId)
            .to.be.true;
    });
});
