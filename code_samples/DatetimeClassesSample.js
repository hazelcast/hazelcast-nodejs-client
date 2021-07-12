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

const { Client, HzLocalTime, HzLocalDate, HzLocalDateTime, HzOffsetDateTime } = require('..');

class CustomNumber {
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
        return new CustomNumber();
    }
    return null;
}

(async () => {
    try {
        const cfg = {
            serialization: {
                portableFactories: {
                    1: portableFactory
                }
            }
        };

        const client = await Client.newHazelcastClient(cfg);

        const map = await client.getMap('timestampWithTimezoneMap');

        // You can use datetime classes for any operation
        // Let's add some timestamp with timezones using wrapper class `HzOffsetDatetime`:

        // Constructors can be used with or without new
        await map.set('1', HzOffsetDateTime(HzLocalDateTime(HzLocalDate(1, 2, 3), HzLocalTime(3, 4, 5)), 123456789));
        await map.set('2', HzOffsetDateTime(HzLocalDateTime(HzLocalDate(2, 2, 3), HzLocalTime(3, 4, 5)), 123456789));
        await map.set('3', HzOffsetDateTime(HzLocalDateTime(HzLocalDate(3, 2, 3), HzLocalTime(3, 4, 5)), 123456789));
        await map.set('4', HzOffsetDateTime(HzLocalDateTime(HzLocalDate(4, 2, 3), HzLocalTime(3, 4, 5)), 123456789));

        // You can also use other data structures

        const queue = await client.getQueue('dateQueue');

        await queue.add(HzLocalDate('1998', '12', '2'));

        console.log((await queue.take()).toString()); // 1998-12-02

        console.log(await map.get('1')); // HzOffsetDateTime object

        // You can run an SQL query:

        const result = client.getSql().execute('SELECT * FROM timestampWithTimezoneMap WHERE this > ?', [
            HzOffsetDateTime(HzLocalDateTime(HzLocalDate(2, 3, 4), HzLocalTime(5, 6, 7)), 123456789)
        ]);

        // The following for loop prints:

        for await (const row of result) {
            console.log(`key: ${row['__key']}, value: ${row['this']}`);
        }

    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
