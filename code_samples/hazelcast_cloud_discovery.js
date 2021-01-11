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
const path = require('path');

(async () => {
    try {
        const cfg = {
            clusterName: 'hazelcast',
            network: {
                hazelcastCloud: {
                    discoveryToken: 'EXAMPLE_TOKEN'
                },
                ssl: {
                    enabled: true,
                    sslOptionsFactoryProperties: {
                        servername: 'Hazelcast-Inc',
                        rejectUnauthorized: true,
                        caPath: path.resolve(__dirname, './ca.pem'),
                        keyPath: path.resolve(__dirname, './key.pem'),
                        certPath: path.resolve(__dirname, './cert.pem')
                    }
                }
            }
        };
        const client = await Client.newHazelcastClient(cfg);

        const map = await client.getMap('testMap');
        await map.put('key', 'value');
        const value = await map.get('key');
        console.log(value);

        await client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
    }
})();
