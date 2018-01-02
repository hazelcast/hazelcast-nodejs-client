/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

var Client = require('../.').Client;
var insertPerson = function (map, key, val, ttl) {
    return map.put(key, val, ttl).then(function(previousVal) {
        console.log('Put key: ' + key + ', value: ' + JSON.stringify(val) + ',  previous value: ' + JSON.stringify(previousVal));
    });
};

var removePerson = function (map, key) {
    return map.remove(key).then(function() {
        console.log('Removed ' + key);
    });
};

var getPerson = function (map, key) {
    return map.get(key).then(function(val) {
        console.log('Person with id ' + key + ': ' + JSON.stringify(val));
    });
};

var shutdownHz = function(client) {
    return client.shutdown();
};

Client.newHazelcastClient().then(function (hazelcastClient) {
    var map = hazelcastClient.getMap('people');
    var john = {firstname: 'John', lastname: 'Doe'};
    var jane = {firstname: 'Jane', lastname: 'Doe'};
    //insert
    insertPerson(map, 1, john)
        .then(function () {
            //get
            return getPerson(map, 1);
        })
        .then(function () {
            //remove
            return removePerson(map, 1);
        })
        .then(function () {
            //insert with ttl
            return insertPerson(map, 2, jane, 1000);
        })
        .then(function() {
            return getPerson(map, 2);
        })
        .then(function() {
            //Jane should be erased after 1000 milliseconds
            setTimeout(function() {
                getPerson(map, 2).then(function() {
                    shutdownHz(hazelcastClient);
                });
            }, 1000)
        });
});
