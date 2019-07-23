/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

const fs = require('fs');
var Config = require('hazelcast-client').Config.ClientConfig;
var Client = require('hazelcast-client').Client;

var config = new Config();
config.networkConfig.sslConfig.enabled = true;

config.networkConfig.sslConfig.sslOptions = {
    ca: [
        fs.readFileSync('ca.pem')
    ],
    chiphers: [
        'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
        'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
        'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384'].join(':'),
    servername: 'servername'
};

Client.newHazelcastClient(config).then(function (client) {
    console.log('This client is options sample using SSL.');
    return client.shutdown();
});
