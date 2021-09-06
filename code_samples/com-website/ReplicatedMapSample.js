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
        // Start the Hazelcast Client and connect to an already running
        // Hazelcast Cluster on 127.0.0.1
        const hz = await Client.newHazelcastClient();
        // Get a Replicated Map called 'my-replicated-map'
        const map = await hz.getReplicatedMap('my-replicated-map');
        // Put and Get a value from the Replicated Map
        // (key/value is replicated to all members)
        const replacedValue = await map.put('key', 'value');
        // Will print 'Replaced value: null' as it's the first update
        console.log('Replaced value:', replacedValue);
        const value = await map.get('key');
        // The value is retrieved from a random member in the cluster
        console.log('Value for key:', value);
        // Shutdown this Hazelcast client
        await hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
