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
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    var list;
    // Get the Distributed List from Cluster.
    hz.getList('my-distributed-list').then(function (l) {
        list = l;
        // Add elements to the list
        return list.add('item1');
    }).then(function () {
        return list.add('item2');
    }).then(function () {
        //Remove the first element
        return list.removeAt(0);
    }).then(function (value) {
        console.log(value);
        // There is only one element left
        return list.size();
    }).then(function (len) {
        console.log(len);
        // Clear the list
        return list.clear();
    }).then(function () {
        // Shutdown this Hazelcast client
        hz.shutdown();
    });
});
