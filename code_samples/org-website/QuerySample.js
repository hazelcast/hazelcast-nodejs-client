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
var Predicates = require('hazelcast-client').Predicates;
var Config = require('hazelcast-client').Config;

function User(username, age, active) {
    this.username = username;
    this.age = age;
    this.active = active;
}

User.prototype.readPortable = function (reader) {
    this.username = reader.readUTF('username');
    this.age = reader.readInt('age');
    this.active = reader.readBoolean('active');
};

User.prototype.writePortable = function (writer) {
    writer.writeUTF('username', this.username);
    writer.writeInt('age', this.age);
    writer.writeBoolean('active', this.active);
};

User.prototype.getFactoryId = function () {
    return 1;
};

User.prototype.getClassId = function () {
    return 1;
};

function PortableFactory() {
    // Constructor sample
}

PortableFactory.prototype.create = function (classId) {
    if (classId === 1) {
        return new User();
    }
    return null;
};

function generateUsers(users) {
    return users.put('Rod', new User('Rod', 19, true)).then(function () {
        return users.put('Jane', new User('Jane', 20, true));
    }).then(function () {
        return users.put('Freddy', new User('Freddy', 23, true));
    });
}

var cfg = new Config.ClientConfig();
cfg.serializationConfig.portableFactories[1] = new PortableFactory();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    var users;
    // Get a Distributed Map called "users"
    hz.getMap('users').then(function (mp) {
        users = mp;
        // Add some users to the Distributed Map
        return generateUsers(users)
    }).then(function () {
        // Create a Predicate
        var criteriaQuery = Predicates.and(
            Predicates.equal('active', true),
            Predicates.between('age', 18, 21)
        );
        // Get result collections using the the Predicate
        return users.valuesWithPredicate(criteriaQuery);
    }).then(function (values) {
        // Print out the results
        console.log(values.toArray());
        // Shutdown this Hazelcast Client
        hz.shutdown();
    })
});
