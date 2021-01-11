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

/*
 * This sample code demonstrates multiversion support of Portable serialization.
 * With multiversion support, you can have two clients that have different
 * versions of the same object, and Hazelcast will store both meta information and use the
 * correct one to serialize and deserialize portable objects depending on the client.
 */

var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config.ClientConfig;

// Default (version 1) Employee class.
function Employee(name, age) {
    this.name = name;
    this.age = age;
}

Employee.prototype.readPortable = function (reader) {
    this.name = reader.readUTF('name');
    this.age = reader.readInt('age');
};

Employee.prototype.writePortable = function (writer) {
    writer.writeUTF('name', this.name);
    writer.writeInt('age', this.age);
};

Employee.prototype.getFactoryId = function () {
    return 1;
};

Employee.prototype.getClassId = function () {
    return 1;
};

Employee.prototype.getVersion = function () {
    return 1;
};

function PortableFactory() {
}

PortableFactory.prototype.create = function (classId) {
    if (classId === 1) {
        return new Employee();
    }
    return null;
};

/*
 * If you update the class by changing the type of one of the fields or by adding a new field,
 * it is a good idea to upgrade the version id, rather than sticking to the global versioning
 * that is specified in the hazelcast.xml file.
 */

// Version 2: Added new field manager name (string).
function Employee2(name, age, manager) {
    this.name = name;
    this.age = age;
    this.manager = manager;
}

Employee2.prototype.readPortable = function (reader) {
    this.name = reader.readUTF('name');
    this.age = reader.readInt('age');
    this.manager = reader.readUTF('manager');
};

Employee2.prototype.writePortable = function (writer) {
    writer.writeUTF('name', this.name);
    writer.writeInt('age', this.age);
    writer.writeUTF('manager', this.manager);
};

Employee2.prototype.getFactoryId = function () {
    return 1;
};

Employee2.prototype.getClassId = function () {
    return 1;
};

// It is necessary to implement this method for multiversion support to work.
Employee2.prototype.getVersion = function () {
    return 2; // Specifies version different than the global version.
};

function PortableFactory2() {
}

PortableFactory2.prototype.create = function (classId) {
    if (classId === 1) {
        return new Employee2();
    }
    return null;
};

/*
 * However, having a version that changes across incompatible field types such as int and String will cause
 * a type error as clients with older versions of the class tries to access it. We will demonstrate this below.
 */

//Version 3 Employee class. Changed age field type from int to String. (Incompatible type change)
function Employee3(name, age, manager) {
    this.name = name;
    this.age = age;
    this.manager = manager;
}

Employee3.prototype.readPortable = function (reader) {
    this.name = reader.readUTF('name');
    this.age = reader.readUTF('age');
    this.manager = reader.readUTF('manager');
};

Employee3.prototype.writePortable = function (writer) {
    writer.writeUTF('name', this.name);
    writer.writeUTF('age', this.age);
    writer.writeUTF('manager', this.manager);
};

Employee3.prototype.getFactoryId = function () {
    return 1;
};

Employee3.prototype.getClassId = function () {
    return 1;
};

Employee3.prototype.getVersion = function () {
    return 3;
};

function PortableFactory3() {
}

PortableFactory3.prototype.create = function (classId) {
    if (classId === 1) {
        return new Employee3();
    }
    return null;
};

// Let's now configure 3 clients with 3 different versions of Employee.
var cfg = new Config();
cfg.serializationConfig.portableFactories[1] = new PortableFactory();

var cfg2 = new Config();
cfg2.serializationConfig.portableFactories[1] = new PortableFactory2();

var cfg3 = new Config();
cfg3.serializationConfig.portableFactories[1] = new PortableFactory3();

var map, map2, map3;
var client, client2, client3;

Promise.all([
        Client.newHazelcastClient(cfg),
        Client.newHazelcastClient(cfg2),
        Client.newHazelcastClient(cfg3)
    ]
).then(function (clients) {
    /*
     * Assume that a client joins a cluster with a newer version of a class.
     * If you modified the class by adding a new field, the new client's put operations include that
     * new field.
     */
    client = clients[0];
    client2 = clients[1];
    client3 = clients[2];
    return Promise.all([
        client.getMap('employee-map'),
        client2.getMap('employee-map'),
        client3.getMap('employee-map')
    ]);
}).then(function (maps) {
    map = maps[0];
    map2 = maps[1];
    map3 = maps[2];
    return map.clear();
}).then(function () {
    return map.put(0, new Employee('Jack', 28));
}).then(function () {
    return map2.put(1, new Employee2('Jane', 29, 'Josh'));
}).then(function () {
    return map.size();
}).then(function (size) {
    console.log('Map Size:', size);
    return map.values();
}).then(function (values) {
    /*
     * If this new client tries to get an object that was put from the older clients, it
     * gets null for the newly added field.
     */
    values.toArray().forEach(function (value) {
        console.log(value);
    });
    return map2.values();
}).then(function (values) {
    values.toArray().forEach(function (value) {
        console.log(value);
    });
    // Let's try now to put a version 3 Employee object to the map and see what happens.
    return map3.put(2, new Employee3('Joe', '30', 'Mary'));
}).then(function () {
    return map.size();
}).then(function (size) {
    console.log('Map Size:', size);
    /*
     * As clients with incompatible versions of the class try to access each other, a HazelcastSerializationError
     * is raised (caused by a TypeError).
     */
    return map.get(2).catch(function (err) {
        // Client that has class with int type age field tries to read Employee3 object with String age field.
        console.log('Failed due to:', err.message);
    });
}).then(function () {
    return map3.get(0).catch(function (err) {
        // Client that has class with String type age field tries to read Employee object with int age field.
        console.log('Failed due to:', err.message);
    });
}).then(function () {
    client.shutdown();
    client2.shutdown();
    client3.shutdown();
});
