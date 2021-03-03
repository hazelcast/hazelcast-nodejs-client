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

const { Client, Predicates } = require('../../');
const IdentifiedEntryProcessor = require('./IdentifiedEntryProcessor');
const identifiedFactory = require('./IdentifiedFactory');

const MS_IN_SEC = 1e3;
const NS_IN_MS = 1e6;
const NS_IN_SEC = 1e9;

/**
 * Test variables
 */

const MAX_ALLOWED_ACTIVE_REQUESTS = 32;
const MAX_ALLOWED_CONSECUTIVE_REQUESTS = MAX_ALLOWED_ACTIVE_REQUESTS;
let stopTest = false;
let runningOperations = 0;
let startTime;
let endTime;
let client;
let totalOps = 0;
let nz = 0;

/**
 * Helper functions
 */

function fancyDuration(millisec) {
    const times = Math.floor(millisec / 1000);

    const secs = Math.floor(times % 60);
    const minutes = Math.floor((times % 3600) / 60);
    const hours = Math.floor(times / 3600);

    return hours + ':' + minutes + ':' + secs;
}

function hrtimeToNanoSec(t) {
    return t[0] * NS_IN_SEC + t[1];
}

function hrtimeToMilliSec(t) {
    return t[0] * MS_IN_SEC + (t[1] / NS_IN_MS);
}

function randomString(max) {
    return Math.floor(Math.random() * Math.floor(max)).toString();
}

function randomInt(upto) {
    return Math.floor(Math.random() * upto);
}

/**
 * Entry listener
 */
function nop() {
}

const listener = {
    added: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    updated: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    removed: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    evicted: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    clearedAll: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    evictedAll: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
};

process.on('SIGINT', function () {
    console.log('Shutting down!');
    stopTest = true;
    nz++;
    if (nz === 2) {
        process.exit(1);
    }
});

function testCompleted() {
    endTime = new Date();
    client.shutdown().then(() => {
        const elapsedMilliseconds = endTime.getTime() - startTime.getTime();
        console.log('Test completed at ' + endTime + '.\n' +
            'Elapsed time(s): ' + fancyDuration(elapsedMilliseconds));
        console.log(`Completed ${totalOps / (elapsedMilliseconds / 1000)} ops/sec.`);
    }).catch((err) => {
        console.error('Error occurred during shut down:', err);
    });
}

function completeIfNoActiveCallbacks() {
    if (stopTest && runningOperations === 0) {
        testCompleted();
    }
}

function handleError(err) {
    console.log(err);
    process.exit(1);
}

function completeOperation() {
    runningOperations--;
    totalOps++;
    if (totalOps % 10000 === 0) {
        console.log(`Completed operation count: ${totalOps}`);
        const lagStartTime = process.hrtime();
        setImmediate(function () {
            const eventLoopLag = process.hrtime(lagStartTime);
            if (hrtimeToNanoSec(eventLoopLag) > 40 * NS_IN_MS) {
                console.log(`Experiencing event loop lag: ${hrtimeToMilliSec(eventLoopLag)} ms.`);
            }
        });
    }
    completeIfNoActiveCallbacks();
}

/**
 * Test
 */

const cfg = {
    network: {
        clusterMembers: []
    },
    serialization: {
        dataSerializableFactories: {
            66: identifiedFactory
        }
    }
};
for (let i = 2; i < process.argv.length; i++) {
    cfg.network.clusterMembers[0] = process.argv[i];
}

(async () => {
    try {
        client = await Client.newHazelcastClient(cfg);
        const map = await client.getMap('default');
        map.addEntryListener(listener);

        startTime = new Date();
        console.log('Test started at ' + startTime);
        (function innerOperation() {
            if (stopTest) {
                completeIfNoActiveCallbacks();
                return;
            }
            if (runningOperations > MAX_ALLOWED_ACTIVE_REQUESTS) {
                setTimeout(innerOperation, 1);
            } else {
                if (runningOperations >= MAX_ALLOWED_CONSECUTIVE_REQUESTS) {
                    setTimeout(innerOperation, 1);
                } else {
                    process.nextTick(innerOperation);
                }
                const key = randomString(10000);
                const value = randomString(10000);
                const operation = randomInt(100);

                runningOperations++;
                let promise;
                if (operation < 30) {
                    promise = map.get(key).then(completeOperation);
                } else if (operation < 60) {
                    promise = map.put(key, value).then(completeOperation);
                } else if (operation < 80) {
                    promise = map.valuesWithPredicate(Predicates.between('this', 0, 10)).then(completeOperation);
                } else {
                    promise = map.executeOnKey(key, new IdentifiedEntryProcessor(key)).then(completeOperation);
                }
                promise.catch(handleError);
            }
        })();
    } catch (err) {
        console.error('Error occurred during start up:', err);
    }
})();
