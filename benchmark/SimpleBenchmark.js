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

class Benchmark {
    constructor(config) {
        this._nextOp = config.nextOp;
        this.totalOpsCount = config.totalOpsCount;
        this.batchSize = config.batchSize;
        this.opsCount = 0;
    }
    // increments ops counter, starts a new op and returns its promise
    nextOp() {
        this.opsCount++;
        return this._nextOp();
    }
    // chains next op once one of ops finishes to keep constant concurrency of ops
    chainNext(op) {
        return op.then(() => {
            if (this.opsCount < this.totalOpsCount) {
                return this.chainNext(this.nextOp());
            }
        });
    }
    run() {
        // initial batch of ops (no-op promises)
        const batch = new Array(this.batchSize).fill(Promise.resolve());
        const start = process.hrtime();
        return Promise.all(batch.map(this.chainNext.bind(this)))
            .then(() => {
                const time = process.hrtime(start);
                const tookSec = time[0] + time[1] * 1e-9;
                console.log(`Took ${tookSec} seconds for ${this.opsCount} requests`);
                console.log(`Ops/s: ${this.opsCount / tookSec}`);
            });
    }
};

module.exports = Benchmark;
