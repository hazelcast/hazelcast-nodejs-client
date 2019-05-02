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

var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;

function Employee(id, name) {
    this.id = id;
    this.name = name;
}

Employee.prototype.readData = function (input) {
    this.id = input.readInt();
    this.name = input.readUTF();
};

Employee.prototype.writeData = function (output) {
    output.writeInt(this.id);
    output.writeUTF(this.name);
};

Employee.prototype.getFactoryId = function () {
    return 1000;
};

Employee.prototype.getClassId = function () {
    return 100;
};

function SampleDataSerializableFactory() {
    // Constructor function
}

SampleDataSerializableFactory.prototype.create = function (type) {
    if (type === 100) {
        return new Employee();
    }
    return null;
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.dataSerializableFactories[1000] = new SampleDataSerializableFactory();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    // Employee can be used here
    hz.shutdown();
});

