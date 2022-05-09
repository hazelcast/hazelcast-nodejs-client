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
const { Client, Fields, GenericRecords } = require('hazelcast-client');
const Long = require('long');

async function main() {
    const fields = {
        name: Fields.STRING,
        age: Fields.INT32,
        id: Fields.INT64
    };

    const record = GenericRecords.compact('employee', fields, {
        age: 21,
        name: 'John',
        id: Long.fromNumber(11)
    });

    const anotherRecord = GenericRecords.compact('employee', fields, {
        age: 19,
        name: 'Jane',
        id: Long.fromNumber(10)
    });

    const clonedRecord = record.clone();

    const updatedClonedRecord = record.clone({age: 22});

    const client = await Client.newHazelcastClient();
    const map = await client.getMap('genericRecordSampleMap');
    await map.put(1, record);
    await map.put(2, anotherRecord);
    await map.put(3, clonedRecord);
    await map.put(4, updatedClonedRecord);

    for (let i = 1; i <= 4; i++) {
        const record = await map.get(i);
        console.log(`Age: ${record.getInt32('age')} Name: ${record.getString('name')} Id: ${record.getInt64('id')}`);

    }
    await client.shutdown();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
