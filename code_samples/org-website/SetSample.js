/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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
    var set;
    // Get the Distributed Set from Cluster.
    hz.getSet('my-distributed-set').then(function (s) {
        set = s;
        // Add items to the set with duplicates
        return set.add('item1');
    }).then(function () {
        return set.add('item1');
    }).then(function () {
        return set.add('item2');
    }).then(function () {
        return set.add('item2');
    }).then(function () {
        return set.add('item2');
    }).then(function () {
        return set.add('item3');
    }).then(function () {
        // Get the items. Note that there are no duplicates
        return set.toArray();
    }).then(function (values) {
        console.log(values);
    }).then(function () {
        // Shutdown this Hazelcast client
        hz.shutdown();
    });
});
