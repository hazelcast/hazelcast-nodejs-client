'use strict';

const REQ_COUNT = 50000;
const BATCH_SIZE = 100;

const Benchmark = require('./SimpleBenchmark');
const Client = require('../.').Client;

Client.newHazelcastClient()
    .then((client) => client.getMap('default'))
    .then((map) => {
        return Promise.all([map.put('foo1', 'looooooooooooong key 1'), map.put('foo2', 'looooooooooooong key 2')])
            .then(() => {
                return Promise.all([map.get('foo1'), map.get('foo2')])
                  .then((vals) => {
                      console.log('foo1: ' + vals[0]);
                      console.log('foo2: ' + vals[1]);
                  })
            })
            .then(() => map.destroy())
            .then(() => map.client.shutdown());
    })
    .then(() => console.log('Benchmark finished'));
