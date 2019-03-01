'use strict';

const REQ_COUNT = 50000;
const BATCH_SIZE = 100;

const Benchmark = require('./SimpleBenchmark');
const Client = require('../.').Client;

Client.newHazelcastClient()
    .then((client) => client.getMap('default'))
    .then((map) => {
        const benchmark = new Benchmark({
            nextOp: () => map.put('foo', 'bar'),
            totalOpsCount: REQ_COUNT,
            batchSize: BATCH_SIZE
        });
        return benchmark.run()
            .then(() => map.destroy())
            .then(() => map.client.shutdown());
    })
    .then(() => console.log('Benchmark finished'));
