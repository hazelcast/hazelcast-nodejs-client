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

var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    var rb;
    // Get a Ringbuffer called "rb"
    hz.getRingbuffer('rb').then(function (buffer) {
        rb = buffer;
        return rb.add(100);
    }).then(function () {
        return rb.add(200);
    }).then(function (value) {
        // we start from the oldest item.
        // if you want to start from the next item, call rb.tailSequence()+1
        return rb.headSequence();
    }).then(function (sequence) {
        return rb.readOne(sequence).then(function (value) {
            console.log(value);
            return rb.readOne(sequence.add(1));
        }).then(function (value) {
            console.log(value);
            // Shutdown this Hazelcast Client
            hz.shutdown();
        });
    });
});
