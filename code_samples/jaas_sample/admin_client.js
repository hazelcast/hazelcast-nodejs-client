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

var adminClientConfig = new Config();

adminClientConfig.serializationConfig.portableFactories[1] = new UsernamePasswordCredentialsFactory();
adminClientConfig.customCredentials = new UsernamePasswordCredentials('admin', 'password1', '127.0.0.1');

Client.newHazelcastClient(adminClientConfig).then(function (adminClient) {
    console.log('Admin client connected');
    var adminMap;
    return adminClient.getMap('importantAdminMap').then(function (map) {
        console.log('Admin can create a map');
        adminMap = map;
        return adminMap.get('someKey');
    }).then(function (value) {
        console.log('Admin can read from map: ' + value);
        return adminMap.put('anotherKey', 'anotherValue'); // Should resolve
    }).then(function () {
        console.log('Admin can put to map');
        return adminMap.get('anotherKey');
    }).then(function (value) {
        console.log('Value for the "anotherKey" is ' + value);
        return adminClient.shutdown();
    });
});
