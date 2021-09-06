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

const { Client, HazelcastSqlException } = require('hazelcast-client');

(async () => {
    try {
        const client = await Client.newHazelcastClient();
        const mapName = 'myMap';
        const map = await client.getMap(mapName);
        // To be able to use our map in SQL we need to create mapping for it.
        const createMappingQuery = `
            CREATE MAPPING ${mapName} (
                __key VARCHAR,
                this DOUBLE
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = 'varchar',
                'valueFormat' = 'double'
            )
        `;
        // executions are async, await on update count to wait for execution.
        await client.getSql().execute(createMappingQuery).getUpdateCount();

        // populate map
        await map.put('key1', 1);
        await map.put('key2', 2);
        await map.put('key3', 3);
        await map.put('key4', 4);
        await map.put('key5', 5);

        try {
            const result = client.getSql().execute('SELECT * FROM myMap');

            console.log('Rows from unsorted query:');
            for await (const row of result) {
                console.log(`${row['__key']}: ${row['this']}`);
            }
        } catch (e) {
            if (e instanceof HazelcastSqlException) {
                // HazelcastSqlException is thrown if an error occurs during SQL execution.
                console.log(`An SQL error occurred while running SQL: ${e}`);
            } else {
                // for all other errors
                console.log(`An error occurred while running SQL: ${e}`);
            }
        }

        // In order to add an index clear the map.
        await map.clear();

        // Add an SORTED index to value field.
        await map.addIndex({
            type: 'SORTED',
            attributes: ['this']
        });

        // populate map
        await map.put('key1', 1);
        await map.put('key2', 2);
        await map.put('key3', 3);
        await map.put('key4', 4);
        await map.put('key5', 5);

        try {
            // Expected to see 2 3 4
            const result = client.getSql().execute('SELECT * FROM myMap ORDER BY this ASC LIMIT 3 OFFSET 1');

            console.log('Rows from sorted query with limit 3 and offset 1:');
            for await (const row of result) {
                console.log(`${row['__key']}: ${row['this']}`);
            }
        } catch (e) {
            if (e instanceof HazelcastSqlException) {
                // HazelcastSqlException is thrown if an error occurs during SQL execution.
                console.log(`An SQL error occurred while running SQL: ${e}`);
            } else {
                // for all other errors
                console.log(`An error occurred while running SQL: ${e}`);
            }
        }

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
