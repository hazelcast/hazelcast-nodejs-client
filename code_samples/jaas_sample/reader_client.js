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
const { UsernamePasswordCredentials } = require('./user_pass_cred');
const { usernamePasswordCredentialsFactory } = require('./user_pass_cred_factory');

(async () => {
    try {
        const readerClient = await Client.newHazelcastClient({
            serialization: {
                portableFactories: {
                    1: usernamePasswordCredentialsFactory
                }
            },
            customCredentials: new UsernamePasswordCredentials('reader', 'password2', '127.0.0.1')
        });
        console.log('Admin client connected');

        const readerMap = await readerClient.getMap('importantReaderMap');
        console.log('Reader can create a map');
        const value = await readerMap.get('someKey');
        console.log('Reader can read from map:', value);
        try {
            await readerMap.put('anotherKey', 'anotherValue'); // Should reject
        } catch (err) {
            console.log('Reader cannot put to map. Reason:', err);
        }

        await readerClient.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
