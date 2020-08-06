/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

const { Client } = require('hazelcast-client');

class TimeOfDay {
    constructor(hour, minute, second) {
        this.hour = hour;
        this.minute = minute;
        this.second = second;
    }

    hzGetCustomId() {
        return 42;
    }
}

class CustomSerializer {
    getId() {
        return 42;
    }

    write(output, timeofday) {
        const secondPoint = (timeofday.hour * 60 + timeofday.minute) * 60 + timeofday.second;
        output.writeInt(secondPoint);
    }

    read(input) {
        const obj = new TimeOfDay();
        let unit = input.readInt();
        obj.second = unit % 60;
        unit = (unit - obj.second) / 60;
        obj.minute = unit % 60;
        unit = (unit - obj.minute) / 60;
        obj.hour = unit;
        obj.customDeserialized = true;
        return obj;
    }
}

const giveInformation = (timeofday) => {
    console.log('-------------------');
    console.log('Custom deserialized:', !!(timeofday.customDeserialized));
    console.log('Hour:', timeofday.hour);
    console.log('Minute:', timeofday.minute);
    console.log('Second:', timeofday.second);
    console.log('-------------------');
};

(async () => {
    try {
        const client = await Client.newHazelcastClient({
            serialization: {
                customSerializers: [new CustomSerializer()]
            }
        });

        const t = new TimeOfDay(5, 32, 59);
        giveInformation(t);

        const map = await client.getMap('time');
        await map.put(1, t);
        const deserialized = await map.get(1);
        giveInformation(deserialized);

        client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
