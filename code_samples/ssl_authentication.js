/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

var Config = require('hazelcast-client').Config;
var HazelcastClient = require('hazelcast-client').Client;

if (process.argv.length < 5 ) {
    console.log('Usage: \n' +
        'node ssl_authentication.js [servername] [certificate-file] [trusted-ca]');
    return
}

var cfg = new Config.ClientConfig();
cfg.networkConfig.sslOptions = {
    servername: process.argv[2],
    cert: process.argv[3],
    ca: process.argv[4]
};

HazelcastClient.newHazelcastClient(cfg).then(function (client) {
    console.log('This client is authenticated using ssl.');
    client.shutdown();
});
