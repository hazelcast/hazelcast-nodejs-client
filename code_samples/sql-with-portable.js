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

const { Client } = require('hazelcast-client');
const long = require('long');

// Portable class
class Student {
    constructor(age, height) {
        this.age = age;
        this.height = height;
        this.factoryId = 23;
        this.classId = 1;
    }

    readPortable(reader) {
        this.age = reader.readInt('age');
        this.height = reader.readDouble('height');
    }

    writePortable(writer) {
        writer.writeInt('age', this.age);
        writer.writeDouble('height', this.height);
    }
}

(async () => {
    try {

        const portableFactory = (classId) => {
            if (classId === 1) return new Student();
            return null;
        };

        const client = await Client.newHazelcastClient({
            serialization: {
                portableFactories: {
                    23: portableFactory
                }
            }
        });

        const map = await client.getMap('myMap');

        const student1 = new Student(12, 123.23);
        const student2 = new Student(15, 13.23);
        const student3 = new Student(17, 135.23);
        await map.put(0, student1);
        await map.put(1, student2);
        await map.put(2, student3);

        /*
          long used here because default number type is double. We can also use casting with the syntax:
          `CAST(? AS INTEGER)`. When comparing, column type and parameter type should be comparable. Note that we can
          also cast to other integer types such as BIGINT or TINYINT. Another option would be to change default
          number type in client config.
        */
        console.log('with long:');

        let result = client.getSqlService().execute('SELECT * FROM myMap WHERE age > ? AND age < ?',
            [long.fromNumber(13), long.fromNumber(18)]);

        for await (const row of result) {
            console.log(`${row['__key']}: Age: ${row['age']} Height: ${row['height']}`);
        }

        console.log('with casting:');
        // with casting
        result = client.getSqlService().execute(
            'SELECT * FROM myMap WHERE age > CAST(? AS TINYINT) AND age < CAST(? AS BIGINT)',
            [13, 18]
        );

        for await (const row of result) {
            console.log(`${row['__key']}: Age: ${row['age']} Height: ${row['height']}`);
        }

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
