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

const { Client, SqlColumnType } = require('hazelcast-client');

(async () => {
    try {
        const client = await Client.newHazelcastClient();
        const map = await client.getMap('myMap');

        await map.put('key1', 1);
        await map.put('key2', 2);
        await map.put('key3', 3);

        let result = client.getSqlService().execute('SELECT __key, this FROM myMap WHERE this > ?', [1]);
        const rowMetadata = await result.getRowMetadata();
        const columns = await rowMetadata.getColumns();

        console.log('Columns:');
        for (const column of columns) {
            console.log(`${column.name}: ${SqlColumnType[column.type]}`);
        }

        console.log('Rows from query 1:');
        for await (const row of result) {
            console.log(`${row['__key']}: ${row['this']}`);
        }

        result = client.getSqlService().execute('SELECT __key, this FROM myMap WHERE this > ?', [1], {
            returnRawResult: true // Return raw SqlRows instead of plain objects
        });

        console.log('Rows from query 2:');
        for await (const row of result) {
            console.log(`${row.getObject('__key')}: ${row.getObject('this')}`);
        }

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
