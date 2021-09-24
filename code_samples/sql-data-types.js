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

const { Client, SqlColumnType, HazelcastSqlException } = require('hazelcast-client');
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

const varcharExample = async (client) => {
    console.log('----------VARCHAR Example----------');
    const mapName = 'varcharMap';
    const someMap = await client.getMap(mapName);
    // To be able to use our map in SQL we need to create mapping for it.
    const createMappingQuery = `
            CREATE MAPPING ${mapName} (
                __key DOUBLE,
                this VARCHAR
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = 'double',
                'valueFormat' = 'varchar'
            )
        `;
    await client.getSql().execute(createMappingQuery);

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, key.toString());
    }

    try {
        const result = await client.getSql().execute('SELECT * FROM varcharMap WHERE this = ? OR this = ?', ['7', '2']);
        const rowMetadata = result.getRowMetadata();
        const columnIndex = rowMetadata.findColumn('this');
        const columnMetadata = rowMetadata.getColumn(columnIndex);
        console.log(SqlColumnType[columnMetadata.type]); // VARCHAR
        for await (const row of result) {
            console.log(row);
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
};

/*
    Since Node.js client sends all numbers as double by default, giving a number as parameter
    will not work for `BIGINT` type. Instead, you can use `long` objects or you can use explicit
    casting which can convert doubles to other integer types.
*/
const integersExample = async (client) => {
    console.log('---------- BIGINT Example----------');
    const mapName = 'bigintMap';
    const someMap = await client.getMap(mapName);
    // To be able to use our map in SQL we need to create mapping for it.
    const createMappingQuery = `
            CREATE MAPPING ${mapName} (
                __key DOUBLE,
                this BIGINT
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = 'double',
                'valueFormat' = 'bigint'
            )
        `;
    await client.getSql().execute(createMappingQuery);

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, long.fromNumber(key * 2));
    }

    try {
        const result = await client.getSql().execute(
            'SELECT * FROM bigintMap WHERE this > ? AND this < ?',
            [long.fromNumber(10), long.fromNumber(18)]
        );
        const rowMetadata = result.getRowMetadata();
        const columnIndex = rowMetadata.findColumn('this');
        const columnMetadata = rowMetadata.getColumn(columnIndex);
        console.log(SqlColumnType[columnMetadata.type]); // BIGINT

        for await (const row of result) {
            console.log(row);
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

    try {
        // Casting example. Casting to other integer types is also possible.
        const result = await client.getSql().execute(
            'SELECT * FROM bigintMap WHERE this > CAST(? AS BIGINT) AND this < CAST(? AS BIGINT)',
            [10, 18]
        );

        for await (const row of result) {
            console.log(row);
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
};

// Portable example
const objectExample = async (client, classId, factoryId) => {
    console.log('----------OBJECT Example----------');
    const mapName = 'studentMap';
    const someMap = await client.getMap(mapName);
    // To be able to use our map in SQL we need to create mapping for it.
    const createMappingQuery = `
            CREATE MAPPING ${mapName} (
                __key DOUBLE,
                age INT,
                height DOUBLE
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = 'double',
                'valueFormat' = 'portable',
                'valuePortableFactoryId' = '${factoryId}',
                'valuePortableClassId' = '${classId}'
            )
        `;
    await client.getSql().execute(createMappingQuery);

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, new Student(long.fromNumber(key), 1.1));
    }

    try {
        // Note: If you do not specify `this` and use *, by default, `age` and `height` columns will be fetched
        // instead of `this`.
        // This is true only for complex custom objects like portable and identified serializable.
        const result = await client.getSql().execute(
            'SELECT __key, this FROM studentMap WHERE age > CAST(? AS INTEGER) AND age < CAST(? AS INTEGER)',
            [3, 8]
        );

        const rowMetadata = result.getRowMetadata();
        const columnIndex = rowMetadata.findColumn('this');
        const columnMetadata = rowMetadata.getColumn(columnIndex);
        console.log(SqlColumnType[columnMetadata.type]); // OBJECT

        for await (const row of result) {
            const student = row['this'];
            console.log(student);
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
};

(async () => {
    try {
        // Since we will use a portable, we register it:
        const portableFactory = (classId) => {
            if (classId === 1) {
                return new Student();
            }
            return null;
        };

        const client = await Client.newHazelcastClient({
            serialization: {
                portableFactories: {
                    23: portableFactory
                }
            }
        });

        await varcharExample(client);
        await integersExample(client);
        await objectExample(client, 1, 23);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
