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

const { Client, SqlColumnType } = require('hazelcast-client');

(async () => {
    const client = await Client.newHazelcastClient();
    const mapName = 'jsonMap';

    // In order to use the map in SQL a mapping should be created.
    const createMappingQuery = `
            CREATE OR REPLACE MAPPING ${mapName}  (
                __key BIGINT,
                this JSON
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = 'bigint',
                'valueFormat' = 'json'
            )
        `;
    await client.getSql().execute(createMappingQuery);

    // Clear the map for a fresh start.
    const map = await client.getMap(mapName);
    await map.clear();

    // You need to use HazelcastJsonValue as parameter if you configured a global serializer
    await client.getSql().execute(`INSERT INTO ${mapName} VALUES (1, ?)`,
        [{age: 1}]
    );

    const result = await client.getSql().execute(`SELECT * FROM ${mapName}`);
    const rowMetadata = result.rowMetadata;
    const columns = rowMetadata.getColumns();

    console.log('Columns:');
    for (const column of columns) {
        console.log(`${column.name}: ${SqlColumnType[column.type]}`);
    }

    console.log('\nRows from query:');
    for await (const row of result) {
        console.log(`${row['__key']}: ${row['this']}`);
        console.log(`Value is of type ${row['this'].constructor.name}`);
    }

    await client.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
