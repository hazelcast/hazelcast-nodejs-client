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

const Pipelining = require('../.').Pipelining;

class Benchmark {
    constructor(config) {
        this.nextOp = config.nextOp;
        this.totalOpsCount = config.totalOpsCount;
        this.pipeliningDepth = config.pipeliningDepth;
        this.opsCount = 0;
    }

    run() {
        const pipelining = new Pipelining(this.pipeliningDepth, this.createLoadGenerator());
        const start = new Date();
        return pipelining.run()
            .then(() => {
                const finish = new Date();
                const tookSec = (finish - start) / 1000;
                console.log(`Took ${tookSec} seconds for ${this.totalOpsCount} requests`);
                console.log(`Ops/s: ${this.totalOpsCount / tookSec}`);
            });
    }

    createLoadGenerator() {
        return () => {
            const index = this.opsCount++;
            if (index < this.totalOpsCount) {
                return this.nextOp();
            }
            return null;
        }
    }
}

module.exports = Benchmark;
