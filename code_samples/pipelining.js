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

var Client = require('hazelcast-client').Client;
var Pipelining = require('hazelcast-client').Pipelining;


var REQUEST_COUNT = 1000;
var DEPTH = 10;

function createPutLoadGenerator(map) {
    var counter = 0;
    return function () {
        var index = counter++;
        if (index < REQUEST_COUNT) {
            return map.put(index, index).then(function (oldValue) {
                // Handle return value within the load generator
                if (oldValue) {
                    console.log(oldValue + ' is replaced with ' + index);
                }
            });
        }
        return null;
    }
}

function createGetLoadGenerator(map) {
    var counter = 0;
    return function () {
        var index = counter++;
        if (index < REQUEST_COUNT) {
            return map.get(index);
        }
        return null;
    }
}

Client.newHazelcastClient().then(function (hazelcastClient) {
    var client = hazelcastClient;
    var map;
    var getPipelining;
    return client.getMap('pipelining').then(function (mp) {
        map = mp;
        var putLoadGenerator = createPutLoadGenerator(map);
        var putPipelining = new Pipelining(DEPTH, putLoadGenerator);
        return putPipelining.run();
    }).then(function (result) {
        console.log('Put operations are completed. ' +
            'Result should be undefined: ' + result);
        var getLoadGenerator = createGetLoadGenerator(map);
        getPipelining = new Pipelining(DEPTH, getLoadGenerator, true);
        return getPipelining.run();
    }).then(function (result) {
        console.log('Get operations are completed. ' +
            'Result should contain all the values in order: ' + result);
        getPipelining.setLoadGenerator(createGetLoadGenerator(map));
        return getPipelining.run();
    }).then(function (result) {
        console.log('Second run of the get operations are completed. ' +
            'Result should contain two copy of all the values in order ' +
            'since we used the same pipeline: ' + result);
        return client.shutdown();
    });
});
