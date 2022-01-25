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
        const client = await Client.newHazelcastClient({
            properties: {
                'hazelcast.logging.level': 'OFF'
            }
        });
        const mapName = 'myMap' + Math.floor(Math.random() * 10000);
        const map = await client.getMap(mapName);

        // In order to use the map in SQL a mapping should be created.
        const createMappingQuery = `
            CREATE OR REPLACE MAPPING ${mapName} (
                __key VARCHAR,
                this DOUBLE
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = 'varchar',
                'valueFormat' = 'double'
            )
        `;
        await client.getSql().execute(createMappingQuery);

        await map.put('key1', 1);
        await map.put('key2', 2);
        await map.put('key3', 3);

        let result;

        result = await client.getSql().execute(`SELECT __key, this FROM ${mapName} WHERE this > ?`, [1]);
        const rowMetadata = result.rowMetadata;
        const columns = rowMetadata.getColumns();

        console.log('SQL Columns:');
        for (const column of columns) {
            console.log(`${column.name}: ${SqlColumnType[column.type]}`);
        }

        console.log('\nRows from query 1:');
        for await (const row of result) {
            // By default a row is a plain javascript object. Keys are column names and values are column values
            console.log(`${row['__key']}: ${row['this']}`);
        }

        // You can set returnRawResult to true to get rows as `SqlRow` objects
        result = await client.getSql().execute(`SELECT __key, this FROM ${mapName} WHERE this > ?`, [1], {
            returnRawResult: true
        });

        console.log('\nRows from query 2:');
        for await (const row of result) {
            console.log(`${row.getObject('__key')}: ${row.getObject('this')}`);
        }

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
