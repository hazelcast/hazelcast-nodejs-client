'use strict';

const REQ_COUNT = 50000;
const BATCH_SIZE = 100;

const ENTRY_COUNT = 10 * 1000;
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
