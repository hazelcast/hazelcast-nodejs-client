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
        // Start the Hazelcast Client and connect to an already running
        // Hazelcast Cluster on 127.0.0.1
        const hz = await Client.newHazelcastClient();
        // Get the Distributed Semaphore from CP Subsystem
        const semaphore = await client.getCPSubsystem().getSemaphore('my-semaphore');
        // Initialize the semaphore
        const initialized = await semaphore.init(3);
        console.log('Initialized:', initialized);
        // Check number of available permits
        let available = await semaphore.availablePermits();
        console.log('Available:', available);
        // Now acquire permits
        await semaphore.acquire(3);
        available = await semaphore.availablePermits();
        console.log('Available after acquire:', available);
        // Release some permits
        await semaphore.release(2);
        available = await semaphore.availablePermits();
        console.log('Available after release:', available);
        // Shutdown this Hazelcast client
        await hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
