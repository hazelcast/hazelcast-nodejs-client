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

const REQ_COUNT = 100000;
const BATCH_SIZE = 100;

const ENTRY_COUNT = 1000;
const VALUE_SIZE = 10000;
const GET_PERCENTAGE = 40;
const PUT_PERCENTAGE = 40;

let value_string = '';
for (let i = 0; i < VALUE_SIZE; i++) {
    value_string = value_string + 'x';
}

function randomOp(map) {
    const key = Math.random() * ENTRY_COUNT;
    const opType = Math.floor(Math.random() * 100);
    if (opType < GET_PERCENTAGE) {
        return map.get(key);
    } else if (opType < GET_PERCENTAGE + PUT_PERCENTAGE) {
        return map.put(key, value_string);
    }
    return map.remove(key);
}

const Benchmark = require('./SimpleBenchmark');
const Client = require('../.').Client;

Client.newHazelcastClient()
    .then((client) => client.getMap('default'))
    .then((map) => {
        const benchmark = new Benchmark({
            nextOp: () => randomOp(map),
            totalOpsCount: REQ_COUNT,
            batchSize: BATCH_SIZE
        });
        return benchmark.run()
            .then(() => map.destroy())
            .then(() => map.client.shutdown());
    })
    .then(() => console.log('Benchmark finished'));
