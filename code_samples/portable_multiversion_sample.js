/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
'use strict';

/*
 * This sample code demonstrates multiversion support of Portable serialization.
 * With multiversion support, you can have two clients that have different
 * versions of the same object, and Hazelcast will store both meta information
 * and use the correct one to serialize and deserialize portable objects depending
 * on the client.
 */

const { Client } = require('hazelcast-client');

// Default (version 1) Employee class.
class Employee {
    constructor(name, age) {
        this.name = name;
        this.age = age;
        this.factoryId = 1;
        this.classId = 1;
        this.version = 1;
    }

    readPortable(reader) {
        this.name = reader.readString('name');
        this.age = reader.readInt('age');
    }

    writePortable(writer) {
        writer.writeString('name', this.name);
        writer.writeInt('age', this.age);
    }
}

function portableFactory(classId) {
    if (classId === 1) {
        return new Employee();
    }
    return null;
}

/*
 * If you update the class by changing the type of one of the fields or by adding a new field,
 * it is a good idea to upgrade the version id, rather than sticking to the global versioning
 * that is specified in the hazelcast.xml file.
 */

// Version 2: Added new field manager name (string).
class Employee2 {
    constructor(name, age, manager) {
        this.name = name;
        this.age = age;
        this.manager = manager;
        this.factoryId = 1;
        this.classId = 1;
        // Specify version different than the global version.
        this.version = 2;
    }

    readPortable(reader) {
        this.name = reader.readString('name');
        this.age = reader.readInt('age');
        this.manager = reader.readString('manager');
    }

    writePortable(writer) {
        writer.writeString('name', this.name);
        writer.writeInt('age', this.age);
        writer.writeString('manager', this.manager);
    }
}

function portableFactory2(classId) {
    if (classId === 1) {
        return new Employee2();
    }
    return null;
}

/*
 * However, having a version that changes across incompatible field types such as int and
 * String will cause a type error as clients with older versions of the class tries to
 * access it. We will demonstrate this below.
 */

// Version 3 Employee class. Changed age field type from int to String.
// (Incompatible type change)
class Employee3 {
    constructor(name, age, manager) {
        this.name = name;
        this.age = age;
        this.manager = manager;
        this.factoryId = 1;
        this.classId = 1;
        this.version = 3;
    }

    readPortable(reader) {
        this.name = reader.readString('name');
        this.age = reader.readString('age');
        this.manager = reader.readString('manager');
    }

    writePortable(writer) {
        writer.writeString('name', this.name);
        writer.writeString('age', this.age);
        writer.writeString('manager', this.manager);
    }
}

function portableFactory3(classId) {
    if (classId === 1) {
        return new Employee3();
    }
    return null;
}

(async () => {
    // Let's now configure 3 clients with 3 different versions of Employee.
    const cfg = {
            serialization: {
                portableFactories: {
                    1: portableFactory
                }
            }
    };
    const cfg2 = {
            serialization: {
                portableFactories: {
                    1: portableFactory2
                }
            }
    };
    const cfg3 = {
            serialization: {
                portableFactories: {
                    1: portableFactory3
                }
            }
    };

    const client = await Client.newHazelcastClient(cfg);
    const client2 = await Client.newHazelcastClient(cfg2);
    const client3 = await Client.newHazelcastClient(cfg3);

    /*
         * Assume that a client joins a cluster with a newer version of a class.
         * If you modified the class by adding a new field, the new client's put
         * operations include that new field.
         */
    const map = await client.getMap('employee-map');
    const map2 = await client2.getMap('employee-map');
    const map3 = await client3.getMap('employee-map');

    await map.put(0, new Employee('Jack', 28));
    await map2.put(1, new Employee2('Jane', 29, 'Josh'));

    let size = await map.size();
    console.log('Map size:', size);
    let values = await map.values();
    /*
         * If this new client tries to get an object that was put from the older
         * clients, it gets `null` for the newly added field.
         */
    for (const value of values) {
        console.log(value);
    }
    values = await map2.values();
    for (const value of values) {
        console.log(value);
    }

    /*
         * Let's try now to put a version 3 Employee object to the map and see
         * what happens.
         */
    await map3.put(2, new Employee3('Joe', '30', 'Mary'));
    size = await map.size();
    console.log('Map size:', size);

    /*
         * As clients with incompatible versions of the class try to access each
         * other, a HazelcastSerializationError is raised (caused by a TypeError).
         */
    try {
        await map.get(2);
    } catch (err) {
        // Client that has class with int type age field tries to read Employee3
        // object with string `age` field.
        console.log('Failed due to:', err.message);
    }
    try {
        await map3.get(0);
    } catch (err) {
        // Client that has class with String type age field tries to read
        // Employee object with int `age` field.
        console.log('Failed due to:', err.message);
    }

    await client.shutdown();
    await client2.shutdown();
    await client3.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
