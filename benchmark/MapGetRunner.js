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

const Benchmark = require('./SimpleBenchmark');
const Client = require('../.').Client;

const REQ_COUNT = 100000;
const BATCH_SIZE = 100;

function randomString(len) {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for (let i = 0; i < len; i++) {
        const pos = Math.floor(Math.random() * charSet.length);
        res += charSet.substring(pos, pos + 1);
    }
    return res;
}

const KEY = '00000000-0000-0000-0000-000000000000';
const VAL = randomString(100 * 1024);

(async () => {
    try {
        const client = await Client.newHazelcastClient();
        const map = await client.getMap('default');
        await map.set(KEY, VAL);

        const benchmark = new Benchmark({
            nextOp: () => map.get(KEY),
            totalOpsCount: REQ_COUNT,
            batchSize: BATCH_SIZE
        });
        await benchmark.run();
        console.log('Benchmark finished');

        await map.destroy();
        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
