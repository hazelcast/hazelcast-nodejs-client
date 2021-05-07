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

const { Client, SqlColumnType, HzLocalDate, HzLocalDateTime, HzOffsetDateTime, HzLocalTime } =
    require('hazelcast-client');
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
    const someMap = await client.getMap('varcharMap');

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, key.toString());
    }

    const result = client.getSqlService().execute('SELECT * FROM varcharMap WHERE this = ? OR this = ?', ['7', '2']);
    const rowMetadata = await result.getRowMetadata();
    console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // VARCHAR

    for await (const row of result) {
        console.log(row);
    }
};

const booleanExample = async (client) => {
    console.log('----------BOOLEAN Example----------');
    const someMap = await client.getMap('booleanMap');

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, key % 2 === 0);
    }

    const result = client.getSqlService().execute('SELECT * FROM booleanMap WHERE this = ?', [true]);
    const rowMetadata = await result.getRowMetadata();
    console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // BOOLEAN

    for await (const row of result) {
        console.log(row);
    }
};

/*
    Note for TINYINT, SMALLINT, INTEGER AND BIGINT

    Since Node.js client sends all numbers as double by default, giving a number as parameter will not work for these
    types. Instead, you can use `long` objects or you can use explicit casting which converts doubles to integers. The
    casting behaviour is Java's casting behaviour. So, e.g, 3.1 becomes 3.
*/
const integersExample = async (client) => {
    console.log('----------TINYINT, SMALLINT, INTEGER AND BIGINT Example----------');
    const someMap = await client.getMap('bigintMap');

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, long.fromNumber(key * 2));
    }

    const result = client.getSqlService().execute(
        'SELECT * FROM bigintMap WHERE this > ? AND this < ?',
        [long.fromNumber(10), long.fromNumber(18)]
    );
    const rowMetadata = await result.getRowMetadata();
    console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // BIGINT

    for await (const row of result) {
        console.log(row);
    }

    // Casting example
    const result2 = client.getSqlService().execute(
        'SELECT * FROM bigintMap WHERE this > CAST(? AS BIGINT) AND this < CAST(? AS BIGINT)',
        [10, 18]
    );

    for await (const row of result2) {
        console.log(row);
    }
};

// Arbitrary precision decimal
const decimalExample = async (client) => {
    console.log('----------DECIMAL Example----------');
    // Pretend that there are decimal entries in the map added by another client. Then the query would be as follows.
    const result = client.getSqlService().execute(
        // We need these casts since we are sending strings.
        'SELECT * FROM decimalMap WHERE this > CAST(? AS DECIMAL) AND this < CAST(? AS DECIMAL)',
        ['-0.00000000000000000000000000000001', '1.0000000000000231213123123125465462513214653123']
    );

    try {
        const rowMetadata = await result.getRowMetadata();
        console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // DOUBLE

        for await (const row of result) {
            console.log(row);
        }
    } catch (e) { // throws since map does not exist
        console.log(e);
    }

};

const realExample = async (client) => {
    console.log('----------REAL Example----------');

    const result = client.getSqlService().execute(
        'SELECT * FROM realMap WHERE this > CAST(? AS REAL) AND this < CAST(? AS REAL)',
        [-0.5, 0.5]
    );

    try {
        const rowMetadata = await result.getRowMetadata();
        console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // REAL

        for await (const row of result) {
            console.log(row);
        }
    } catch (e) { // throws since map does not exist
        console.log(e);
    }

};

const doubleExample = async (client) => {
    console.log('----------DOUBLE Example----------');
    const someMap = await client.getMap('doubleMap');

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, key / 10); // We are actually adding doubles here since default number type is double
    }

    const result = client.getSqlService().execute(
        // you may need to cast if default number type is different
        'SELECT * FROM doubleMap WHERE this > ? AND this < ?',
        [-0.7, 0.7]
    );
    const rowMetadata = await result.getRowMetadata();
    console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // DOUBLE

    for await (const row of result) {
        console.log(row);
    }
};

const dateExample = async (client) => {
    console.log('----------DATE Example----------');

    // pretend that there are date objects in the map, then the query would be as follows:
    const result = client.getSqlService().execute(
        // we need casting because a string is transmitted internally
        'SELECT * FROM dateMap WHERE this > CAST (? AS DATE) AND this < CAST (? AS DATE)',
        [new HzLocalDate(1, 1, 1), new HzLocalDate(5, 5, 5)]
    );

    try {
        const rowMetadata = await result.getRowMetadata();
        console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // DATE

        for await (const row of result) {
            const date = row['this']; // HzLocalDate

            console.log(date.getYear());
            console.log(date.getMonth());
            console.log(date.getDate());
        }
    } catch (e) { // throws since map does not exist
        console.log(e);
    }
};

const timeExample = async (client) => {
    console.log('----------TIME Example----------');

    // pretend that there are time objects in the map, then the query would be as follows:
    const result = client.getSqlService().execute(
        // we need casting because a string is transmitted internally
        'SELECT * FROM timeMap WHERE this > CAST (? AS TIME) AND this < CAST (? AS TIME)',
        [new HzLocalTime(1, 0, 0, 0), new HzLocalTime(10, 0, 0, 0)]
    );

    try {
        const rowMetadata = await result.getRowMetadata();
        console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // TIME

        for await (const row of result) {
            const time = row['this']; // HzLocalTime

            console.log(time.getHour());
            console.log(time.getMinute());
            console.log(time.getSecond());
            console.log(time.getNano());
        }
    } catch (e) { // throws since map does not exist
        console.log(e);
    }
};

const timestampExample = async (client) => {
    console.log('----------TIMESTAMP Example----------');

    // pretend that there are datetime objects in the map, then the query would be as follows:
    const result = client.getSqlService().execute(
        // we need casting because a string is transmitted internally
        'SELECT * FROM timestampMap WHERE this > CAST (? AS TIMESTAMP) AND this < CAST (? AS TIMESTAMP)',
        [
            new HzLocalDateTime(new HzLocalDate(1, 6, 5), new HzLocalTime(4, 3, 2, 1)),
            new HzLocalDateTime(new HzLocalDate(9, 6, 5), new HzLocalTime(4, 3, 2, 1))
        ]
    );

    try {
        const rowMetadata = await result.getRowMetadata();
        console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // TIMESTAMP

        for await (const row of result) {
            const datetime = row['this']; // HzLocalDateTime

            console.log(datetime.getHzLocalDate().getYear());
            console.log(datetime.getHzLocalDate().getMonth());
            console.log(datetime.getHzLocalDate().getDate());
            console.log(datetime.getHzLocalTime().getHour());
            console.log(datetime.getHzLocalTime().getMinute());
            console.log(datetime.getHzLocalTime().getSecond());
            console.log(datetime.getHzLocalTime().getNano());
        }

    } catch (e) { // throws since map does not exist
        console.log(e);
    }
};

const timestampWithTimezoneExample = async (client) => {
    console.log('----------TIMESTAMP WITH TIMEZONE Example----------');

    // pretend that there are offsetdatetime objects in the map, then the query would be as follows:
    const result = client.getSqlService().execute(
        // we need casting because a string is transmitted internally
        'SELECT * FROM timestampWithTimezoneMap WHERE this > CAST (? AS TIMESTAMP_WITH_TIME_ZONE)' +
        'AND this < CAST (? AS TIMESTAMP_WITH_TIME_ZONE)',
        [
            HzOffsetDateTime.fromHzLocalDateTime(
                new HzLocalDateTime(new HzLocalDate(1, 6, 5), new HzLocalTime(4, 3, 2, 1)),
                0
            ),
            HzOffsetDateTime.fromHzLocalDateTime(
                new HzLocalDateTime(new HzLocalDate(9, 6, 5), new HzLocalTime(4, 3, 2, 1)),
                0
            )
        ]
    );

    try {
        const rowMetadata = await result.getRowMetadata();
        console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // DATE

        for await (const row of result) {
            const offsetDatetime = row['this']; // HzOffsetDateTime
            const localDatetime = offsetDatetime.getHzLocalDateTime();
            const localDate = localDatetime.getHzLocalDate();
            const localTime = localDatetime.getHzLocalTime();

            console.log(localDate.getYear());
            console.log(localDate.getMonth());
            console.log(localDate.getDate());

            console.log(localTime.getHour());
            console.log(localTime.getMinute());
            console.log(localTime.getSecond());
            console.log(localTime.getNano());

            console.log(offsetDatetime.getOffsetSeconds());
        }
    } catch (e) { // throws since map does not exist
        console.log(e);
    }
};
const objectExample = async (client) => {
    console.log('----------OBJECT Example----------');

    const someMap = await client.getMap('studentMap');

    for (let key = 0; key < 10; key++) {
        await someMap.set(key, new Student(long.fromNumber(key), 1.1));
    }

    // Note: If you do not specify this and use *, by default age and height columns will be fetched instead of this.
    // This is true only for complex custom objects like portable and identified serializable.
    const result = client.getSqlService().execute('SELECT __key, this FROM studentMap WHERE age > ? AND age < ?',
        [long.fromNumber(3), long.fromNumber(8)]
    );

    const rowMetadata = await result.getRowMetadata();
    console.log(SqlColumnType[rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type]); // OBJECT

    for await (const row of result) {
        const student = row['this']; // Student
        console.log(student);
    }
};

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

        await varcharExample(client);
        await booleanExample(client);
        await integersExample(client);
        await decimalExample(client);
        await realExample(client);
        await doubleExample(client);
        await dateExample(client); // should log error
        await timeExample(client); // should log error
        await timestampExample(client); // should log error
        await timestampWithTimezoneExample(client); // should log error
        await objectExample(client);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
