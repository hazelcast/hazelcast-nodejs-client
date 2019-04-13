'use strict';

const REQ_COUNT = 10000;
// TODO: for some reasons throughput get much slower for BATCH_SIZE > 3
//       (~350 vs ~100 ops/s for BATCH_SIZE = 1 vs 4) => need to understand the reason
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
        map.set(KEY, VAL);
        return map;
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
