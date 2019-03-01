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

var Client = require("hazelcast-client").Client;
var HazelcastJson = require("hazelcast-client").HazelcastJson;
var Predicates = require("hazelcast-client").Predicates;

var client;

Client.newHazelcastClient().then(function(hz) {
    client = hz;
    var map;
    return client.getMap("movies").then(function(mp) {
        map = mp;
        var movies = [
            {
                name: "The Shawshank Redemption",
                imdbRating: 9.3
            },
            {
                name: "The Godfather",
                imdbRating: 9.2
            },
            {
                name: "The Dark Knight",
                imdbRating: 9.1
            }
        ];

        return map.putAll(movies.map(function(movie, index) {
            return [index, new HazelcastJson(JSON.stringify(movie))];
        }));
    }).then(function() {
        return map.valuesWithPredicate(Predicates.greaterEqual("imdbRating", 9.2));
    }).then(function(values) {
        values.toArray().forEach(function(value) {
            console.log(value.parse()['name']);
        });
        return client.shutdown();
    });
});
