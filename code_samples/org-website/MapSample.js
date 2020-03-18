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
    var map;
    // Get the Distributed Map from Cluster.
    hz.getMap('my-distributed-map').then(function (mp) {
        map = mp;
        // Standard Put and Get.
        return map.put('key', 'value');
    }).then(function () {
        return map.get('key');
    }).then(function (val) {
        // Concurrent Map methods, optimistic updating
        return map.putIfAbsent('somekey', 'somevalue');
    }).then(function () {
        return map.replace('key', 'value', 'newvalue');
    }).then(function (value) {
        // Shutdown this Hazelcast client
        hz.shutdown();
    });
});
