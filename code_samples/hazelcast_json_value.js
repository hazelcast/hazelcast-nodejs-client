/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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
    Predicates,
    HazelcastJsonValue
} = require('hazelcast-client');

(async () => {
    try {
        const client = await Client.newHazelcastClient({
            serialization: {
                jsonStringDeserializationPolicy: 'NO_DESERIALIZATION'
            }
        });

        const map = await client.getMap('employees');
        const employeesData = [
            { name: 'Alice', age: 35 },
            { name: 'Andy', age: 22},
            { name: 'Bob', age: 37 }
        ];
        await map.putAll(employeesData.map((employee, index) => {
            return [index, new HazelcastJsonValue(JSON.stringify(employee))];
        }));

        const employees = await map.valuesWithPredicate(
            Predicates.and(
                Predicates.sql('name like A%'),
                Predicates.greaterThan("age", 30)
            )
        );
        // Prints all the employees whose name starts with 'A' and age is greater than 30
        for (const employee of employees) {
            console.log(employee.toString());
        }

        client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
