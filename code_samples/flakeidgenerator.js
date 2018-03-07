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

Client.newHazelcastClient().then(function(hazelcastClient){
    var client = hazelcastClient;
    var flakeIdGenerator = hazelcastClient.getFlakeIdGenerator('generator');

    return flakeIdGenerator.newId().then(function (value) {
        console.log('New id: ' + value.toString());
        return client.shutdown();
    });
});
