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
