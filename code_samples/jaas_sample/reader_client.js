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
var Config = require('hazelcast-client').Config.ClientConfig;

var UsernamePasswordCredentials = require('./user_pass_cred').UsernamePasswordCredentials;
var UsernamePasswordCredentialsFactory = require('./user_pass_cred_factory').UsernamePasswordCredentialsFactory;

var readerClientConfig = new Config();

readerClientConfig.serializationConfig.portableFactories[1] = new UsernamePasswordCredentialsFactory();
readerClientConfig.customCredentials = new UsernamePasswordCredentials('reader', 'password2', '127.0.0.1');

Client.newHazelcastClient(readerClientConfig).then(function (readerClient) {
    console.log('Reader client connected');
    var readerMap;
    return readerClient.getMap('importantReaderMap').then(function (map) {
        console.log('Reader can create a map');
        readerMap = map;
        return readerMap.get('someKey');
    }).then(function (value) {
        console.log('Reader can read from map: ' + value);
        return readerMap.put('anotherKey', 'anotherValue'); // Should reject
    }).catch(function (err) {
        console.log('Reader cannot put to map. Reason: ' + err);
        return readerClient.shutdown();
    });
});
