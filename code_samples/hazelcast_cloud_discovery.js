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

var Client = require('hazelcast-client').Client;
var ClientConfig = require('hazelcast-client').Config.ClientConfig;
var fs = require('fs');
var Path = require('path');

function createClientConfigWithSSLOpts(key, cert, ca) {
    var cfg = new ClientConfig();

    // Set up group name and password for authentication
    cfg.groupConfig.name = 'YOUR_CLUSTER_NAME';
    cfg.groupConfig.password = 'YOUR_CLUSTER_PASSWORD';

    // Enable Hazelcast Cloud configuration and set the token of your cluster.
    cfg.networkConfig.cloudConfig.enabled = true;
    cfg.networkConfig.cloudConfig.discoveryToken = 'YOUR_CLUSTER_DISCOVERY_TOKEN';

    // If you have enabled encryption for your cluster, also configure TLS/SSL for the client.
    // Otherwise, skip this step.
    cfg.networkConfig.sslConfig.enabled = true;
    cfg.networkConfig.sslConfig.sslOptions = {
        servername: 'hazelcast.cloud',
        rejectUnauthorized: true,
        ca: fs.readFileSync(Path.join(__dirname, ca)),
        key: fs.readFileSync(Path.join(__dirname, key)),
        cert: fs.readFileSync(Path.join(__dirname, cert)),
        passphrase: 'YOUR_KEY_STORE_PASSWORD'
    };

    return cfg;
}

var cfg = createClientConfigWithSSLOpts('./key.pem', './cert.pem', './ca.pem');

Client.newHazelcastClient(cfg).then(function (client) {
    var map;
    client.getMap("testMap").then(function (mp) {
        map = mp;
        return map.put('key', 'value');
    }).then(function () {
        return map.get('key');
    }).then((res) => {
        console.log(res);
        client.shutdown();
    });
});



