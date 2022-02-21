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

const { Client } = require('hazelcast-client');

async function do50000Gets(client, mapName) {
    const label = '50,000 gets for ' + mapName;
    console.time(label);

    const map = await client.getMap(mapName);

    await map.put('item', 'anItem');
    // Warm up the cache
    await map.get('item');

    const requests = [];
    for (let i = 0; i < 50000; i++) {
        requests.push(map.get('item'));
    }
    await Promise.all(requests);

    console.timeEnd(label);
}

(async () => {
    const nearCachedMapName = 'nearCachedMap';
    const regularMapName = 'reqularMap';

    const client = await Client.newHazelcastClient({
            nearCaches: {
                [nearCachedMapName]: {
                    evictionPolicy: 'LFU',
                    invalidateOnChange: true
                }
            }
    });

    await do50000Gets(client, nearCachedMapName);
    await do50000Gets(client, regularMapName);

    await client.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
