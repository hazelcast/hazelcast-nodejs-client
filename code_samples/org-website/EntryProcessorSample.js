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
var Config = require('hazelcast-client').Config;

function IdentifiedEntryProcessor(value) {
    // Constructor function
}

IdentifiedEntryProcessor.prototype.readData = function (inp) {
};

IdentifiedEntryProcessor.prototype.writeData = function (outp) {
};

IdentifiedEntryProcessor.prototype.getFactoryId = function () {
    return 1;
};

IdentifiedEntryProcessor.prototype.getClassId = function () {
    return 9;
};

function EntryProcessorDataSerializableFactory() {

}

EntryProcessorDataSerializableFactory.prototype.create = function (type) {
    if (type === 1) {
        return new IdentifiedEntryProcessor();
    }
    return null;
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.dataSerializableFactories[1] = new EntryProcessorDataSerializableFactory();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    var map;
    // Get the Distributed Map from Cluster.
    hz.getMap('my-distributed-map').then(function (mp) {
        map = mp;
        // Put the double value of 0 into the Distributed Map
        return map.put('key', 0);
    }).then(function () {
        // Run the IdentifiedEntryProcessor class on the Hazelcast Cluster Member holding the key called "key"
        return map.executeOnKey('key', new IdentifiedEntryProcessor());
    }).then(function () {
        // Show that the IdentifiedEntryProcessor updated the value.
        return map.get('key');
    }).then(function (value) {
        console.log(value);
        // Shutdown the Hazelcast Cluster Member
        hz.shutdown();
    })
});

