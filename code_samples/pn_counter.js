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

Client.newHazelcastClient().then(function (hazelcastClient) {
    var client = hazelcastClient;
    var pnCounter = hazelcastClient.getPNCounter('counter');

    pnCounter.addAndGet(5).then(function (val) {
        console.log('Added 5 to `counter`. Current value is ' + val);
        return pnCounter.decrementAndGet();
    }).then(function (val) {
        console.log('Decremented `counter`. Current value is ' + val);
        return client.shutdown();
    });
});
