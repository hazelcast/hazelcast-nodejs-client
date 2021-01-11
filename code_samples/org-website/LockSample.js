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
    var lock;
    // Get a distributed lock called "my-distributed-lock"
    hz.getLock('my-distributed-lock').then(function (l) {
        lock = l;
        // Now create a lock and execute some guarded code.
        return lock.lock();
    }).then(function () {
        // do something here
    }).finally(function () {
        return lock.unlock();
    }).then(function () {
        // Shutdown this Hazelcast Client
        hz.shutdown();
    });
});
