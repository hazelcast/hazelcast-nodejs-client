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
var cfg = new Config.ClientConfig();

//This comparator is both a comparator and an IdentifiedDataSerializable.
//Note that a comparator should be a serializable object( IdentifiedDataSerializable or Portable)
//because Hazelcast server should be able to deserialize the comparator in order to sort entries.
//So the same class should be registered to Hazelcast server instance.
var comparator = {
    getFactoryId: function () {
        return 1;
    },

    getClassId: function () {
        return 10;
    },

    //This comparator sorts entries according to their keys in reverse alphabetical order.
    sort: function (a, b) {
        if (a[0] > b[0]) return -1;
        if (a[0] < b[0]) return 1;
        return 0;
    },

    readData: function () {

    },

    writeData: function () {

    }
};

//We register our comparator object as IdentifiedDataSerializable.
cfg.serializationConfig.dataSerializableFactories[1] = {
    create: function () {
        return comparator;
    }
};

var predicate = Predicates.paging(Predicates.truePredicate(), 2, comparator);
Client.newHazelcastClient(cfg).then(function (client) {
    var map = client.getMap('test');
    map.putAll([['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5], ['f', 6], ['g', 7]]).then(function () {
        return map.size();
    }).then(function (mapSize) {
        console.log('Added ' + mapSize + ' elements.');

        predicate.setPage(0);
        return map.valuesWithPredicate(predicate);
    }).then(function (values) {
        console.log('Page: ' + 0);
        console.log(values);
        predicate.setPage(1);
        return map.valuesWithPredicate(predicate);
    }).then(function (values) {
        console.log('Page: ' + 1);
        console.log(values);
        predicate.setPage(2);
        return map.valuesWithPredicate(predicate);
    }).then(function (values) {
        console.log('Page: ' + 2);
        console.log(values);
        predicate.setPage(3);
        return map.valuesWithPredicate(predicate);
    }).then(function (values) {
        console.log('Page: ' + 3);
        console.log(values);
        return client.shutdown();
    });
});
