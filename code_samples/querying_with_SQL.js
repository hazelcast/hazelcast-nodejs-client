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
var Predicates = require('hazelcast-client').Predicates;

function Customer(name, active, age) {
    this.name = name;
    this.active = active;
    this.age = age;
}

Client.newHazelcastClient().then(function (client) {
    var personMap;
    client.getMap('personMap').then(function (mp) {
        personMap = mp;

        return personMap.putAll([
            ['1', new Customer('Peter', true, 36)],
            ['2', new Customer('John', false, 40)],
            ['3', new Customer('Roger', true, 20)],
            ['4', new Customer('Jane', true, 27)],
            ['5', new Customer('Mary', false, 22)],
            ['6', new Customer('Ragnar', true, 30)],
            ['7', new Customer('Hilary', true, 19)],
        ]);
    }).then(function () {
        const predicate = new Predicates.sql('active AND age < 30');
        return personMap.valuesWithPredicate(predicate);
    }).then(function (values) {
        values.toArray().forEach(function (value) {
            console.log(value);
        });
        return client.shutdown();
    });
});
