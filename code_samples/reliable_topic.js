/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
    const client = await Client.newHazelcastClient();
    const topic = await client.getReliableTopic('my-distributed-topic');

    topic.addMessageListener((message) => {
        console.log('Received message:\n', message);
        // shut down the client once the message is received
        client.shutdown().catch((err) => {
            console.error('Failed to shut down the client:', err);
        });
    });

    await topic.publish('Hello to distributed world');
})().catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
});
