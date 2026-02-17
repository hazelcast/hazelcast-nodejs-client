// Copyright (c) 2008-2026, Hazelcast, Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const { Client } = require('hazelcast-client');
const fs = require('fs');
const path = require('path');

/*

Copy the following files from Hazelcast Cloud to the same directory as this file:

* ca.pem
* cert.pem
* key.pem

*/

(async () => {
    try {
        const client = await Client.newHazelcastClient(
            {
                network: {
                    hazelcastCloud: {
                        discoveryToken: 'CLOUD-TOKEN-HERE'
                    },
                    ssl: {
                        enabled: true,
                        sslOptions: {
                            ca: [fs.readFileSync(path.resolve(path.join(__dirname, 'ca.pem')))],
                            cert: [fs.readFileSync(path.resolve(path.join(__dirname, 'cert.pem')))],
                            key: [fs.readFileSync(path.resolve(path.join(__dirname, 'key.pem')))],
                            passphrase: 'KEY-PASSWORD-HERE',
                            servername: 'hazelcast.cloud',
                        }
                    }
                },
                clusterName: 'CLUSTERNAME-HERE',
            }
        );
        console.log('Connection Successful!');

        const map = await client.getMap('testMap');
        await map.put('hello', 'world');
        const value = await map.get('hello');
        console.log('value: ', value);
        client.shutdown();
    } catch (err) {
        console.error('Error occurred:', err);
        process.exit(1);
    }
})();
