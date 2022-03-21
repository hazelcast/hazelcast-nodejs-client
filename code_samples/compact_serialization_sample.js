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
const {Client} = require('hazelcast-client');
const Long = require('long');

class Employee {
    constructor(age, id) {
        this.age = age;
        this.id = id;
    }
}

class EmployeeSerializer {
    constructor() {
        this.class = Employee;
        this.typeName = 'Employee';
    }

    read(reader) {
        const age = reader.readInt32('age');
        const id = reader.readInt64('id');
        return new Employee(age, id);
    }

    write(writer, value) {
        writer.writeInt32('age', value.age);
        writer.writeInt64('id', value.id);
    }
}

async function main() {
    const client = await Client.newHazelcastClient({
        serialization: {
            compact: {
                serializers: [new EmployeeSerializer()]
            }
        }
    });
    const map = await client.getMap('mapName');
    await map.put(20, new Employee(1, Long.fromNumber(1)));

    const employee = await map.get(20);
    console.log(employee);
    await client.shutdown();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
