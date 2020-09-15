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

(async () => {
    try {
        const client = await Client.newHazelcastClient();

        const semaphore = await client.getCPSubsystem().getSemaphore('my-semaphore');
        const initialized = await semaphore.init(3);
        console.log('Initialized:', initialized);
        let available = await semaphore.availablePermits();
        console.log('Available:', available);

        await semaphore.acquire(3);
        available = await semaphore.availablePermits();
        console.log('Available after acquire:', available);

        await semaphore.release(2);
        available = await semaphore.availablePermits();
        console.log('Available after release:', available);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
