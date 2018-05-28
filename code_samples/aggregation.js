/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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
var Aggregators = require('hazelcast-client').Aggregators;
var Predicates = require('hazelcast-client').Predicates;

Client.newHazelcastClient().then(function (hazelcastClient) {
    var client = hazelcastClient;
    var map = hazelcastClient.getMap('person-age-map');

    map.putAll([
        ['Philip', 46],
        ['Elizabeth', 44],
        ['Henry', 13],
        ['Paige', 15]
    ]).then(function () {
        return map.aggregate(Aggregators.count());
    }).then(function (count) {
        console.log('There are ' + count + ' people.');
        return map.aggregateWithPredicate(Aggregators.count(), Predicates.lessEqual('this', 18));
    }).then(function (count) {
        console.log('There are ' + count + ' children.');
        return map.aggregate(Aggregators.numberAvg());
    }).then(function (avgAge) {
        console.log('Average age is ' + avgAge);
        return client.shutdown();
    });
});
