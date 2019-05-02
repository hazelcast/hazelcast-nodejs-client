/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

const REQ_COUNT = 10000;
const BATCH_SIZE = 100;

const Benchmark = require('./SimpleBenchmark');
const Client = require('../.').Client;

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

Client.newHazelcastClient()
    .then((client) => client.getMap('default'))
    .then((map) => {
        return map.set(KEY, VAL)
            .then(() => map);
    })
    .then((map) => {
        const benchmark = new Benchmark({
            nextOp: () => map.get(KEY),
            totalOpsCount: REQ_COUNT,
            batchSize: BATCH_SIZE
        });
        return benchmark.run()
            .then(() => map.destroy())
            .then(() => map.client.shutdown());
    })
    .then(() => console.log('Benchmark finished'));
