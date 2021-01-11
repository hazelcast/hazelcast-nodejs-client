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

class Employee {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.factoryId = 1000;
        this.classId = 100;
    }

    readData(input) {
        this.id = input.readInt();
        this.name = input.readUTF();
    }

    writeData(output) {
        output.writeInt(this.id);
        output.writeUTF(this.name);
    }
}

(async () => {
    try {
        const client = await Client.newHazelcastClient({
            serialization: {
                dataSerializableFactories: {
                    1000: (classId) => {
                        if (classId === 100) {
                            return new Employee();
                        }
                        return null;
                    }
                }
            }
        });
        const map = await client.getMap('my-distributed-map');

        let employee = new Employee(42, 'John');
        await map.put('key', employee);

        employee = await map.get('key');
        console.log('Employee object:', employee);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
