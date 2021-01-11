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

var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    var queue;
    // Get a Blocking Queue called "my-distributed-queue"
    hz.getQueue('my-distributed-queue').then(function (q) {
        queue = q;
        // Offer a String into the Distributed Queue
        return queue.offer('item');
    }).then(function () {
        // Poll the Distributed Queue and return the String
        return queue.poll();
    }).then(function () {
        // Timed blocking Operations
        return queue.offer('anotheritem', 500);
    }).then(function () {
        return queue.poll(5000);
    }).then(function () {
        // Indefinitely blocking Operations
        return queue.put('yetanotheritem');
    }).then(function () {
        return queue.take();
    }).then(function (value) {
        console.log(value);
        // Shutdown this Hazelcast Client
        hz.shutdown();
    })
});
