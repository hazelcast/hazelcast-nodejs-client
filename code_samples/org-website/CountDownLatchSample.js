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
        // Get the Distributed CountDownLatch from CP Subsystem
        const latch = await hz.getCPSubsystem().getCountDownLatch('my-latch');
        // Initialize the latch
        const initialized = await latch.trySetCount(3);
        console.log('Initialized:', initialized);
        // Check count
        let count = await latch.getCount();
        console.log('Count:', count);
        // Wait up to 5 seconds for the count to become zero
        try {
            await latch.await(5000);
            console.log('Returned from await()');
        } catch (err) {
            console.error('await() call failed:', err);
        }
        // Bring the count down to zero
        for (let i = 0; i < 3; i++) {
            await latch.countDown();
            count = await latch.getCount();
            console.log('Current count:', count);
        }
        // Shutdown this Hazelcast client
        await hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
