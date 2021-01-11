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
    var counter;
    // Get an Atomic Counter, we'll call it "counter"
    hz.getAtomicLong('counter').then(function (c) {
        counter = c;
        // Add and Get the "counter"
        return counter.addAndGet(3);
    }).then(function (value) {
        return counter.get();
    }).then(function (value) {
        // Display the "counter" value
        console.log('counter: ' + value);
        // Shutdown this Hazelcast Client
        hz.shutdown();
    });
});
