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

const { Client } = require('../.');

class BenchmarkRunner {

    constructor(config) {
        this._nextOp = config.nextOp;
        this.totalOps = config.totalOps;
        this.concurrency = config.concurrency;
        this.ops = 0;
    }

    // increments ops counter, starts a new op and returns its promise
    nextOp() {
        this.ops++;
        return this._nextOp();
    }

    // chains next op once one of ops finishes to keep constant concurrency of ops
    chainNext(op) {
        return op.then(() => {
            if (this.ops < this.totalOps) {
                return this.chainNext(this.nextOp());
            }
        });
    }

    run() {
        // initial batch of ops (no-op promises)
        const batch = new Array(this.concurrency).fill(Promise.resolve());
        const start = process.hrtime();
        return Promise.all(batch.map(this.chainNext.bind(this)))
            .then(() => {
                const time = process.hrtime(start);
                const tookSec = time[0] + time[1] * 1e-9;
                return {
                    tookSec,
                    opsCount: this.ops,
                    opsPerSec: this.ops / tookSec
                };
            });
    }
}

async function runBenchmark(config) {
    const prepareOp = config.prepareOp;
    const nextOp = config.nextOp;
    const totalOps = config.totalOps;
    const concurrency = config.concurrency;

    const client = await Client.newHazelcastClient({
        properties: {
            'hazelcast.logging.level': 'WARN'
        }
    });
    const map = await client.getMap('default');

    if (prepareOp) {
        await prepareOp(map);
    }

    const warmup = new BenchmarkRunner({
        nextOp: () => nextOp(map),
        totalOps: totalOps * 0.1,
        concurrency
    });
    console.log(`Starting warm-up with ${warmup.totalOps} operations`);
    await warmup.run();
    console.log('Warm-up finished');

    const benchmark = new BenchmarkRunner({
        nextOp: () => nextOp(map),
        totalOps,
        concurrency
    });
    const result = await benchmark.run();
    console.log(`Took ${result.tookSec} seconds for ${result.opsCount} operations`);
    console.log(`Ops/s: ${result.opsPerSec}`);
    console.log('Benchmark finished');

    await map.destroy();
    await client.shutdown();
}

module.exports = runBenchmark;
