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
        // Connect to Hazelcast cluster
        const client = await Client.newHazelcastClient();

        // Get or create the 'distributed-map' on the cluster
        const map = await client.getMap('distributed-map');

        // Put 'key', 'value' pair into the 'distributed-map'
        await map.put('key', 'value');

        // Get the value associated with the given key from the cluster
        const value = await map.get('key');
        console.log(value); // Outputs 'value'

        // Shutdown the client
        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
