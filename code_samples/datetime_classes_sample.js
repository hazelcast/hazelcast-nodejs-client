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

// This sample code demonstrates datetime classes usage.

const { Client, LocalDate, LocalTime, LocalDateTime, OffsetDateTime } = require('hazelcast-client');

class DateTimePortable {
    constructor(date, time, timestamp, timestampWithTz) {
        this.date = date;
        this.time = time;
        this.timestamp = timestamp;
        this.timestampWithTz = timestampWithTz;
        this.factoryId = 1;
        this.classId = 1;
    }

    readPortable(reader) {
        this.date = reader.readDate('date');
        this.time = reader.readTime('time');
        this.timestamp = reader.readTimestamp('timestamp');
        this.timestampWithTz = reader.readTimestampWithTimezone('timestampWithTz');
    }

    writePortable(writer) {
        writer.writeDate('date', this.date);
        writer.writeTime('time', this.time);
        writer.writeTimestamp('timestamp', this.timestamp);
        writer.writeTimestampWithTimezone('timestampWithTz', this.timestampWithTz);
    }
}

function portableFactory(classId) {
    if (classId === 1) {
        return new DateTimePortable();
    }
    return null;
}

(async () => {
    const cfg = {
            serialization: {
                portableFactories: {
                    1: portableFactory
                }
            }
    };

    const client = await Client.newHazelcastClient(cfg);

    const mapName = 'timestampWithTimezoneMap';
    const map = await client.getMap(mapName);
    // In order to use the map in SQL a mapping should be created.
    const createMappingQuery = `
            CREATE OR REPLACE MAPPING ${mapName} (
                __key VARCHAR,
                this TIMESTAMP WITH TIME ZONE
            )
            TYPE IMAP
            OPTIONS (
                'keyFormat' = 'varchar',
                'valueFormat' = 'timestamp with time zone'
            )
        `;
    await client.getSql().execute(createMappingQuery);

    // You can use datetime classes for any operation
    // Let's add some timestamp with timezones using `OffsetDatetime`:

    // You can construct a datetime class from other datetime classes:
    await map.set('1', new OffsetDateTime(
        new LocalDateTime(
            new LocalDate(2020, 2, 29),
            new LocalTime(3, 4, 5, 123456789)
        ), 64800)
    );
    // You can also construct it using primitive fields:
    await map.set('2', OffsetDateTime.from(2021, 2, 28, 3, 4, 5, 12345, 3600));
    await map.set('3', OffsetDateTime.from(2022, 2, 28, 3, 4, 5, 12345, -3600));
    await map.set('4', OffsetDateTime.from(2023, 2, 28, 3, 4, 5, 16789, 12000));

    // You can also use other data structures

    const queue = await client.getQueue('dateQueue');
    await queue.add(new LocalDate(1998, 12, 2));

    console.log((await queue.take()).toString()); // 1998-12-02
    console.log(await map.get('1')); // OffsetDateTime object

    // You can run an SQL query:

    const result = await client.getSql().execute('SELECT * FROM timestampWithTimezoneMap WHERE this > ?', [
            OffsetDateTime.from(2020, 3, 1, 5, 6, 7, 123456789, 3600)
    ]);

    // The following for loop prints:
    // key: 4, value: 2023-02-28T03:04:05.000016789+03:20
    // key: 3, value: 2022-02-28T03:04:05.000012345-01:00
    // key: 2, value: 2021-02-28T03:04:05.000012345+01:00
    for await (const row of result) {
        console.log(`key: ${row['__key']}, value: ${row['this']}`);
    }

    // You can use datetime classes as portable fields:

    const set = await client.getSet('datetimePortableSet');
    const portable1 = new DateTimePortable(
        new LocalDate(2020, 8, 12),
        new LocalTime(10, 20, 30, 4000),
        LocalDateTime.from(2020, 8, 12, 10, 20, 30, 4000),
        OffsetDateTime.from(2020, 8, 12, 10, 20, 30, 4000, 3600)
    );
    await set.add(portable1);
    console.log(await set.contains(portable1)); // true

    await client.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
