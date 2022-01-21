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

const { Client } = require('../../lib');
const fs = require('fs');

const CLUSTER_MEMBERS = ['10.212.1.117', '10.212.1.118'];
// const CLUSTER_MEMBERS = ['127.0.0.1'];
const KEY = 1;
const VALUE = 2;
const BENCHMARK_DURATION_SECONDS = 10;
const MAP_NAME = 'test';
const DEFAULT_NUMBER_TYPE = 'integer';

let benchmarkEnded = false;
let warmupEnded = false;

async function createClient() {
    const client = await Client.newHazelcastClient({
        serialization: {
            defaultNumberType: DEFAULT_NUMBER_TYPE
        },
        network: {
            clusterMembers: CLUSTER_MEMBERS
        }
    });
    return client;
}

async function runPut(map) {
    const start = process.hrtime.bigint();
    await map.put(KEY, VALUE);
    const end = process.hrtime.bigint();
    return end - start;
}

async function runGet(map) {
    const start = process.hrtime.bigint();
    await map.get(KEY);
    const end = process.hrtime.bigint();
    return end - start;
}

async function runBenchMark(timeArray, client, runBenchmarkFn) {
    const map = await client.getMap(MAP_NAME);

    console.log('Warmup started for ', runBenchMarkFn.name);
    while(!warmupEnded) {
        await runBenchmarkFn(map);
    }

    console.log('Benchmark started for ', runBenchMarkFn.name);
    while(!benchmarkEnded) {
        const timeElapsed = await runBenchmarkFn(map);
        timeArray.push(timeElapsed);
    }
}

function setBenchmarkAsStartedAndSetTimer() {
    benchmarkEnded = false;
    warmupEnded = false;
    const warmupDuration = BENCHMARK_DURATION_SECONDS * 1000 / 5;
    const benchmarkDuration = warmupDuration + BENCHMARK_DURATION_SECONDS * 1000;

    setTimeout(() => {
        warmupEnded = true;
    }, warmupDuration);
    setTimeout(() => {
        benchmarkEnded = true;
    }, benchmarkDuration);
}

function convertToNumbersAndCalculateAverage(timeArray) {
    const total = timeArray.reduce((acc, current) => {
        return acc + current;
    }, 0);
    const average = Math.trunc(total / timeArray.length);
    return average;
     
}

function writeToFile(filename, average, timeArray) {
    fs.writeFileSync(filename, JSON.stringify({
        average,
        timeArray
    }));
}

async function runBenchMarkAndLogToFile(client, runFn, runBenchmarkFn, filename) {
    const timeArray = [];

    setBenchmarkAsStartedAndSetTimer();
    
    await runFn(timeArray, client, runBenchmarkFn);

    const timeArrayNumbers = timeArray.map(x => Number(x));
    const average = convertToNumbersAndCalculateAverage(timeArrayNumbers);
    
    writeToFile(filename, average, timeArrayNumbers);
}

async function main() {
    const client = await createClient();

    await runBenchMarkAndLogToFile(client, runBenchMark, runPut, 'put.json');
    await runBenchMarkAndLogToFile(client, runBenchMark, runGet, 'get.json');
    
    await client.shutdown();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
