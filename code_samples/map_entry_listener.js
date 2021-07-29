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

(async () => {
    try {
        const client = await Client.newHazelcastClient();
        const map = await client.getMap('notifications' + Math.random().toString());

        const listener = {
            added: (entryEvent) => {
                console.log('Added key: ' + entryEvent.key
                    + ', new value: ' + entryEvent.value
                    + ', old value: ' + entryEvent.oldValue);
            },
            removed: (entryEvent) => {
                console.log('Removed key: ' + entryEvent.key
                    + ', new value: ' + entryEvent.value
                    + ', old value: ' + entryEvent.oldValue);
            }
        };
        await map.addEntryListener(listener, undefined, true);

        await map.put(1, 'new-value');
        await map.remove(1);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
