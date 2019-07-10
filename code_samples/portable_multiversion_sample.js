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

//This sample code demonstrates multiversion support of Portable serialization.

/*  With multiversion support, you can have two members that have different
 versions of the same object, and Hazelcast will store both meta information and use the
 correct one to serialize and deserialize portable objects depending on the member. */


let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let Config2 = require('hazelcast-client').Config;
let Config3 = require('hazelcast-client').Config;

//Default (version 1) Employee class.
function Employee(name, age) {
    this.name = name;
    this.age = age;
};

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

//Version 2 Employee class.
function Employee2(name, age, manager) {
    this.name = name;
    this.age = age;
    this.manager = manager;
};

Employee2.prototype.readPortable = function (reader) {
    this.name = reader.readUTF('name');
    this.age = reader.readInt('age');
    this.manager = reader.readUTF('manager');
};

Employee2.prototype.writePortable = function (writer) {
    writer.writeUTF('name', this.name);
    writer.writeInt('age', this.age);
    writer.writeUTF('manager', this.manager);   //specifies version different than the global version.
};

Employee2.prototype.getFactoryId = function () {
    return 1;
};

Employee2.prototype.getClassId = function () {
    return 1;
};

Employee2.prototype.getVersion = function () {
    return 2;
};

//Version 3 Employee class.
function Employee3(name, age, manager) {
    this.name = name;
    this.age = age;
    this.manager = manager;

};

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


function PortableFactory() {
};

PortableFactory.prototype.create = function (classId) {
    if (classId === 1) {
        return new Employee();
    }
    return null;
};

function PortableFactory2() {
};

PortableFactory2.prototype.create = function (classId) {
    if (classId === 1) {
        return new Employee2();
    }
    return null;
};

function PortableFactory3() {
};

PortableFactory3.prototype.create = function (classId) {
    if (classId === 1) {
        return new Employee3();
    }
    return null;
};

//Let's now configure 3 clients with 3 different versions of Employee.

var cfg = new Config.ClientConfig();
cfg.serializationConfig.portableFactories[1] = new PortableFactory();

var cfg2 = new Config2.ClientConfig();
cfg2.serializationConfig.portableFactories[1] = new PortableFactory2();

var cfg3 = new Config3.ClientConfig();
cfg3.serializationConfig.portableFactories[1] = new PortableFactory3();

let map, map2, map3;
let client1,client2,client3;

// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    client1 = hz;
    return hz.getMap('employee-map');
}).then(function (mp) {
    map = mp;
    return map.put(0, new Employee("Rose", 21));
}).then(function () {
    return map.get(0);
}).then(function (val) {
    console.log("1. ", val);
    return Client.newHazelcastClient(cfg2);
}).then(function (hz) {
    client2 = hz;
    return hz.getMap('employee-map');
}).then(function (mp) {
    map2 = mp;
    return map2.put(1, new Employee2("John", 25, "Jack"));
}).then(function () {
    return map2.get(1);
}).then(function (val) {
    console.log("2. ", val)
    return map2.values();
}).then(function (values) {
    for (let value of values) {
        console.log(`map2   --> `, value);
    }
    return map.getAll([0, 1]);
}).then(function (values) {
    for (let value of values) {
        console.log(`map1   --> `, value);
    }
    return Client.newHazelcastClient(cfg3);
}).then(function (hz) {
    client3 = hz;
    return hz.getMap('employee-map')
}).then(function (mp) {
    map3 = mp;
    return map3.put(2, new Employee3("Nick", "27", "Jane"));
}).then(function () {
    return map3.get(2);
}).then(function (val) {
    console.log("3.", val)
    return map3.values();
}).then(function (values) {
    /*  As clients with incompatible versions of the class try to access each other, a HazelcastSerializationError
    is raised (caused by a TypeError). */

    //Client that has class with String type age field tries to read Employee object with int age field.
    for (let value of values) {
        console.log(`map3   --> `, value);
    }
}).catch(function (error) {
    console.log(' ERROR  --> ' + error);
    return client1.shutdown();
}).then(function () {
    return client2.shutdown();
}).then(function () {
    return client3.shutdown();
});
