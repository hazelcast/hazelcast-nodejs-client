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

const { Predicates } = require('..');
const long = require('long');

const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('get', 'Run get benchmark')
    .command('set', 'Run set benchmark')
    .command('random', 'Run random op (get, set, delete) benchmark')
    .command('sqlRandomQueryBigger', 'Run sql benchmark with a random bigger query')
    .command('sqlRandomPredicateBigger', 'Run predicate benchmark with a random bigger query')
    .command('sqlRandomQueryBiggerWithIndex', 'Run sql benchmark with a random bigger query and index')
    .command('sqlRandomPredicateBiggerWithIndex', 'Run predicate benchmark with a random bigger query and index')
    .command('sqlRandomQueryEqual', 'Run sql benchmark with a random equality query')
    .command('sqlRandomPredicateEqual', 'Run predicate benchmark with a random equality query')
    .number('t')
    .describe('t', 'Total number of operations to run')
    .number('c')
    .describe('c', 'Concurrency level for operations')
    .number('s')
    .describe('s', 'Size of values to use (for ASCII strings)')
    .help('h')
    .argv;
const { runBenchmark, Student } = require('./BenchmarkRunner');

const KEY = '00000000-0000-0000-0000-000000000000';
const VALUE_SIZE = argv.s || 1024;
const VAL = randomString(VALUE_SIZE);

const RANDOM_ENTRY_COUNT = 1000;
const RANDOM_GET_PERCENTAGE = 40;
const RANDOM_SET_PERCENTAGE = 40;

function randomString(len) {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for (let i = 0; i < len; i++) {
        const pos = Math.floor(Math.random() * charSet.length);
        res += charSet.substring(pos, pos + 1);
    }
    return res;
}

const numberOfEntriesInMap = 1000;

async function sqlRandomQueryBigger(map, sqlService) {
    const result = sqlService.execute('SELECT * FROM someMap WHERE age > ?',
        [long.fromNumber(Math.floor(Math.random() * numberOfEntriesInMap))]
    );
    // eslint-disable-next-line no-unused-vars
    for await (const row of result) {
        // no-op
    }
}

async function sqlRandomPredicateBigger(map) {
    const predicate = Predicates.sql(`age > ${Math.floor(Math.random() * numberOfEntriesInMap)}`);
    const values = await map.valuesWithPredicate(predicate);
    // eslint-disable-next-line no-unused-vars
    for (const value of values) {
        // no-op
    }
}

async function sqlRandomQueryEqual(map, sqlService) {
    const result = sqlService.execute('SELECT * FROM someMap WHERE age = ?',
        [long.fromNumber(Math.floor(Math.random() * numberOfEntriesInMap))]
    );
    // eslint-disable-next-line no-unused-vars
    for await (const row of result) {
        // no-op
    }
}

async function sqlRandomPredicateEqual(map) {
    const predicate = Predicates.sql(`age = ${Math.floor(Math.random() * numberOfEntriesInMap)}`);
    const values = await map.valuesWithPredicate(predicate);
    // eslint-disable-next-line no-unused-vars
    for (const value of values) {
        // no-op
    }
}

function randomOp(map) {
    const key = Math.random() * RANDOM_ENTRY_COUNT;
    const opType = Math.floor(Math.random() * 100);
    if (opType < RANDOM_GET_PERCENTAGE) {
        return map.get(key);
    } else if (opType < RANDOM_GET_PERCENTAGE + RANDOM_SET_PERCENTAGE) {
        return map.set(key, VAL);
    }
    return map.delete(key);
}

(async () => {
    try {
        const type = argv._[0];

        let prepareOp;
        let nextOp;
        switch (type) {
            case 'get':
                prepareOp = (map) => map.set(KEY, VAL);
                nextOp = (map) => map.get(KEY);
                break;
            case 'set':
                nextOp = (map) => map.set(KEY, VAL);
                break;
            case 'random':
                nextOp = (map) => randomOp(map);
                break;
            case 'sqlRandomQueryBigger':
                prepareOp = async (map) => {
                    for (let i = 0; i < numberOfEntriesInMap; i++) {
                        await map.set(`key${i}`, new Student(long.fromNumber(i), i + 1));
                    }
                };
                nextOp = (map, sqlService) => sqlRandomQueryBigger(map, sqlService);
                break;
            case 'sqlRandomPredicateBigger':
                prepareOp = async (map) => {
                    for (let i = 0; i < numberOfEntriesInMap; i++) {
                        await map.set(`key${i}`, new Student(long.fromNumber(i), i + 1));
                    }
                };
                nextOp = (map) => sqlRandomPredicateBigger(map);
                break;
            case 'sqlRandomQueryBiggerWithIndex':
                prepareOp = async (map) => {
                    await map.addIndex({
                        type: 'SORTED',
                        attributes: ['age']
                    });

                    for (let i = 0; i < numberOfEntriesInMap; i++) {
                        await map.set(`key${i}`, new Student(long.fromNumber(i), i + 1));
                    }
                };
                nextOp = (map, sqlService) => sqlRandomQueryBigger(map, sqlService);
                break;
            case 'sqlRandomPredicateBiggerWithIndex':
                prepareOp = async (map) => {
                    await map.addIndex({
                        type: 'SORTED',
                        attributes: ['age']
                    });

                    for (let i = 0; i < numberOfEntriesInMap; i++) {
                        await map.set(`key${i}`, new Student(long.fromNumber(i), i + 1));
                    }
                };
                nextOp = (map) => sqlRandomPredicateBigger(map);
                break;
            case 'sqlRandomQueryEqual':
                prepareOp = async (map) => {
                    for (let i = 0; i < numberOfEntriesInMap; i++) {
                        await map.set(`key${i}`, new Student(long.fromNumber(i), i + 1));
                    }
                };
                nextOp = (map, sqlService) => sqlRandomQueryEqual(map, sqlService);
                break;
            case 'sqlRandomPredicateEqual':
                prepareOp = async (map) => {
                    for (let i = 0; i < numberOfEntriesInMap; i++) {
                        await map.set(`key${i}`, new Student(long.fromNumber(i), i + 1));
                    }
                };
                nextOp = (map, sqlService) => sqlRandomPredicateEqual(map, sqlService);
                break;
            default:
                console.error(`Unknown command "${type}". Supported commands are "get", "set", "random".`);
                process.exit(1);
        }

        console.log('Benchmark type:', type);
        console.log('Value size:', VALUE_SIZE);
        await runBenchmark({
            prepareOp,
            nextOp,
            totalOps: argv.t || 1000000,
            concurrency: argv.c || 128
        });
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
