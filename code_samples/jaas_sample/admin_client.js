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
const { UsernamePasswordCredentials } = require('./user_pass_cred');
const { usernamePasswordCredentialsFactory } = require('./user_pass_cred_factory');

(async () => {
    try {
        const adminClient = await Client.newHazelcastClient({
            serialization: {
                portableFactories: {
                    1: usernamePasswordCredentialsFactory
                }
            },
            customCredentials: new UsernamePasswordCredentials('admin', 'password1', '127.0.0.1')
        });
        console.log('Admin client connected');

        const adminMap = await adminClient.getMap('importantAdminMap');
        console.log('Admin can create a map');
        let value = await adminMap.get('someKey');
        console.log('Admin can read from map:', value);
        await adminMap.put('anotherKey', 'anotherValue'); // Should resolve
        console.log('Admin can put to map');
        value = await adminMap.get('anotherKey');
        console.log('Value for the "anotherKey" is', value);

        await adminClient.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
