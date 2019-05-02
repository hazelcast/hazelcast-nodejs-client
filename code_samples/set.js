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

Client.newHazelcastClient().then(function (hazelcastClient) {
    var client = hazelcastClient;
    var set;
    hazelcastClient.getSet('my-distributed-set').then(function (s) {
        set = s;
        return set.add('key');
    }).then(function () {
        console.log('"key" is added to the set.');
        return set.contains('key');
    }).then(function (contains) {
        console.log(contains);
        return set.size();
    }).then(function (val) {
        console.log('Number of elements in the set: ' + val);
        return client.shutdown();
    });
});
