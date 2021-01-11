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
'use strict';

const {
    Client,
    Predicates
} = require('hazelcast-client');

class User {
    constructor(username, age, active) {
        this.username = username;
        this.age = age;
        this.active = active;
        this.factoryId = 1;
        this.classId = 1;
    }

    readPortable(reader) {
        this.username = reader.readUTF('username');
        this.age = reader.readInt('age');
        this.active = reader.readBoolean('active');
    }

    writePortable(writer) {
        writer.writeUTF('username', this.username);
        writer.writeInt('age', this.age);
        writer.writeBoolean('active', this.active);
    }
}

function portableFactory(classId) {
    if (classId === 1) {
        return new User();
    }
    return null;
}

async function generateUsers(usersMap) {
    await usersMap.put('Rod', new User('Rod', 19, true));
    await usersMap.put('Jane', new User('Jane', 20, true));
    await usersMap.put('Freddy', new User('Freddy', 23, true));
}

(async () => {
    try {
        // Start the Hazelcast Client and connect to an already running
        // Hazelcast Cluster on 127.0.0.1
        const hz = await Client.newHazelcastClient({
            serialization: {
                portableFactories: {
                    1: portableFactory
                }
            }
        });
        const usersMap = await hz.getMap('users');
        // Add some users to the Distributed Map
        await generateUsers(usersMap);
        // Create a Predicate from a String (a SQL like Where clause)
        const sqlQuery = Predicates.sql('active AND age BETWEEN 18 AND 21');
        // Creating the same Predicate as above but with a builder
        const criteriaQuery = Predicates.and(
            Predicates.equal('active', true),
            Predicates.between('age', 18, 21)
        );
        // Get result collections using the two different Predicates
        const result1 = await usersMap.valuesWithPredicate(sqlQuery);
        const result2 = await usersMap.valuesWithPredicate(criteriaQuery);
        // Print out the results
        console.log(result1.toArray());
        console.log(result2.toArray());
        // Shutdown this Hazelcast client
        await hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
