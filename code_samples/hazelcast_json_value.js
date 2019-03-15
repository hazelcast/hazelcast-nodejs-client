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
var Config = require('hazelcast-client').Config;
var Predicates = require('hazelcast-client').Predicates;
var HazelcastJsonValue = require('hazelcast-client').HazelcastJsonValue;
var JsonDeserializationType = require('hazelcast-client').JsonDeserializationType;

var config = new Config.ClientConfig();
config.serializationConfig.jsonDeserializationType = JsonDeserializationType.HAZELCAST_JSON_VALUE;

Client.newHazelcastClient(config).then(function(hz) {
    var map;
    return hz.getMap('employees').then(function(mp) {
        map = mp;
        var employees = [
            { name: 'Alice', age: 35 },
            { name: 'Andy', age: 22},
            { name: 'Bob', age: 37 }
        ];

        return map.putAll(employees.map(function (employee, index) {
            return [index, new HazelcastJsonValue(employee)];
        }));
    }).then(function() {
        return map.valuesWithPredicate(Predicates.and(Predicates.sql('name like A%'), Predicates.greaterThan("age", 30)));
    }).then(function(values) {
        // Prints all the employees whose name starts with 'A' and age is greater that 30
        values.toArray().forEach(function(value) {
            console.log(value);
        });
        return hz.shutdown();
    });
});
