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

const varcharExample = async (client) => {
    console.log('----------VARCHAR Example----------');
    const mapName = 'varcharMap';
    const someMap = await client.getMap(mapName);
    // In order to use the map in SQL a mapping should be created.
    const createMappingQuery = `
            CREATE OR REPLACE MAPPING ${mapName} (
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
        const result = await client.getSql().execute(`SELECT * FROM ${mapName} WHERE this = ? OR this = ?`, ['7', '2']);
        const rowMetadata = result.rowMetadata;
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
const bigintExample = async (client) => {
    console.log('\n---------- BIGINT Example----------');
    const mapName = 'bigintMap';
    const someMap = await client.getMap(mapName);
    // In order to use the map in SQL a mapping should be created.
    const createMappingQuery = `
            CREATE OR REPLACE MAPPING ${mapName} (
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

    const result = await client.getSql().execute(
        `SELECT * FROM ${mapName} WHERE this > ? AND this < ?`,
        [long.fromNumber(10), long.fromNumber(18)]
    );
    const rowMetadata = result.rowMetadata;
    const columnIndex = rowMetadata.findColumn('this');
    const columnMetadata = rowMetadata.getColumn(columnIndex);
    console.log(SqlColumnType[columnMetadata.type]); // BIGINT

    for await (const row of result) {
        console.log(row);
    }

    // Casting example. Casting to other integer types is also possible.
    const result2 = await client.getSql().execute(
        `SELECT * FROM ${mapName} WHERE this > CAST(? AS BIGINT) AND this < CAST(? AS BIGINT)`,
        [10, 18]
    );

    for await (const row of result2) {
        console.log(row);
    }
};

// Portable example
const objectExample = async (client, classId, factoryId) => {
    console.log('----------OBJECT Example(Portable)----------');
    const mapName = 'studentMap';
    const someMap = await client.getMap(mapName);
    // In order to use the map in SQL a mapping should be created.
    const createMappingQuery = `
            CREATE OR REPLACE MAPPING ${mapName} (
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

    // Note: If you do not specify `this` and use *, by default, `age` and `height` columns will be fetched
    // instead of `this`.
    // This is true only for complex custom objects like portable and identified serializable.
    const result = await client.getSql().execute(
        `SELECT __key, this FROM ${mapName} WHERE age > CAST(? AS INTEGER) AND age < CAST(? AS INTEGER)`,
        [3, 8]
    );

    const rowMetadata = result.rowMetadata;
    const columnIndex = rowMetadata.findColumn('this');
    const columnMetadata = rowMetadata.getColumn(columnIndex);
    console.log(SqlColumnType[columnMetadata.type]); // OBJECT

    for await (const row of result) {
        const student = row['this'];
        console.log(student);
    }
};

// Compact example
const objectExample2 = async (client, typeName) => {
    console.log('----------OBJECT Example(Compact)----------');
    const mapName = 'employeeMap';
    const someMap = await client.getMap(mapName);
    // To be able to use our map in SQL we need to create mapping for it.
    const createMappingQuery = `
            CREATE OR REPLACE MAPPING ${mapName} (
                __key DOUBLE,
                age INTEGER,
                id BIGINT
            )
            TYPE IMap
            OPTIONS (
                'keyFormat' = 'double',
                'valueFormat' = 'compact',
                'valueCompactTypeName' = '${typeName}'
            )
        `;
    await client.getSql().execute(createMappingQuery);

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, new Employee(key, long.fromNumber(key)));
    }

    const result = await client.getSql().execute(
        'SELECT * FROM employeeMap WHERE id > ? AND id < ?',
        [long.fromNumber(3), long.fromNumber(8)]
    );

    const rowMetadata = result.rowMetadata;
    const columnIndex = rowMetadata.findColumn('age');
    const columnMetadata = rowMetadata.getColumn(columnIndex);
    console.log(SqlColumnType[columnMetadata.type]); // INTEGER

    const columnIndex2 = rowMetadata.findColumn('id');
    const columnMetadata2 = rowMetadata.getColumn(columnIndex2);
    console.log(SqlColumnType[columnMetadata2.type]); // BIGINT

    for await (const row of result) {
        console.log(`Id: ${row['id']} Age: ${row['age']}`);
    }
};

(async () => {
    // Since we will use a portable, we register it:
    const portableFactory = (classId) => {
        if (classId === 1) {
            return new Student();
        }
        return null;
    };

    const employeeSerializer = new EmployeeSerializer();

    const client = await Client.newHazelcastClient({
        serialization: {
            portableFactories: {
                23: portableFactory
            },
            compact: {
                serializers: [employeeSerializer]
            }
        }
    });

    await varcharExample(client);
    await bigintExample(client);
    await objectExample(client, 1, 23);
    await objectExample2(client, employeeSerializer.typeName);

    await client.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
