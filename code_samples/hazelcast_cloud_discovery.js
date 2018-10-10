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

var Client = require('hazelcast-client').Client;
var ClientConfig = require('hazelcast-client').Config.ClientConfig;
var fs = require('fs');
var Path = require('path');


function createClientConfigWithSSLOpts(key, cert, ca) {
    var sslOpts = {
        servername: 'Hazelcast-Inc',
        rejectUnauthorized: true,
        ca: fs.readFileSync(Path.join(__dirname, ca)),
        key: fs.readFileSync(Path.join(__dirname, key)),
        cert: fs.readFileSync(Path.join(__dirname, cert))
    };
    var cfg = new ClientConfig();
    cfg.networkConfig.sslOptions = sslOpts;
    cfg.networkConfig.connectionAttemptLimit = 1000;

    var token = 'EXAMPLE_TOKEN';

    cfg.networkConfig.cloudConfig.enabled = true;
    cfg.networkConfig.cloudConfig.discoveryToken = token;
    cfg.groupConfig.name = 'hazel';
    cfg.groupConfig.password = 'cast';
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



