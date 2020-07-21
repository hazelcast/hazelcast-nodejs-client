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
        // Get the Distributed List from Cluster
        const list = await hz.getList('my-distributed-list');
        // Add elements to the list
        await list.add('item1');
        await list.add('item2');
        //Remove the first element
        const value = await list.removeAt(0);
        console.log('Removed:', value);
        // There is only one element left
        const len = await list.size();
        console.log('Current size is', len);
        // Clear the list
        await list.clear();
        // Shutdown this Hazelcast client
        hz.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
