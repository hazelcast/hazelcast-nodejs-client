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
        // Get the Distributed MultiMap from Cluster
        const multiMap = await hz.getMap('my-distributed-multimap');
        // Put values in the map against the same key
        await multiMap.put('my-key', 'value1');
        await multiMap.put('my-key', 'value2');
        await multiMap.put('my-key', 'value3');
        // Print out all the values for associated with key called 'my-key'
        const values = await multiMap.get('my-key');
        for (const value of values) {
            console.log(value);
        }
        // remove specific key/value pair
        await multiMap.remove('my-key', 'value2');
        // Shutdown this Hazelcast client
        await hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
