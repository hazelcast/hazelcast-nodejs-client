/*
 * Copyright (c) 2008-2026, Hazelcast, Inc. All Rights Reserved.
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

const { Client, LockContext } = require('hazelcast-client');

(async () => {
    const client = await Client.newHazelcastClient();
    const key = 'k1';
    const map = await client.getMap('my-map');
    await map.put(key, 0);

    async function task() {
        // each task runs concurrently
        // create a lock context to prevent race
        await LockContext.run(async () => {
            await map.lock(key);
            try {
                const value = await map.get(key);
                await map.put(key, value + 1);
            } finally {
                await map.unlock(key);
            }
        });
    }

    // 100 concurrent tasks
    const tasks = Array.from({length: 100}, task);
    await Promise.all(tasks);
    const value = await map.get(key);
    // v should be 100
    console.log('value:', value);

    await client.shutdown();
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
