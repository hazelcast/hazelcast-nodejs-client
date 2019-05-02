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
var Long = require('long');

function Customer(name, id, lastOrder) {
    this.name = name;
    this.id = id;
    this.lastOrder = lastOrder;
}

Customer.prototype.readPortable = function (reader) {
    this.name = reader.readUTF('name');
    this.id = reader.readInt('id');
    this.lastOrder = reader.readLong('lastOrder').toNumber();
};

Customer.prototype.writePortable = function (writer) {
    writer.writeUTF('name', this.name);
    writer.writeInt('id', this.id);
    writer.writeLong('lastOrder', Long.fromNumber(this.lastOrder));
};

Customer.prototype.getFactoryId = function () {
    return 1;
};

Customer.prototype.getClassId = function () {
    return 1;
};

function PortableFactory() {
    // Constructor function
}

PortableFactory.prototype.create = function (classId) {
    if (classId === 1) {
        return new Customer();
    }
    return null;
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.portableFactories[1] = new PortableFactory();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    //Customer can be used here
    hz.shutdown();
});

