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

function CustomSerializable(value) {
    this.value = value;
}

CustomSerializable.prototype.hzGetCustomId = function () {
    return 10;
};

function CustomSerializer() {
    //Constructor function
}

CustomSerializer.prototype.getId = function () {
    return 10;
};

CustomSerializer.prototype.write = function (output, t) {
    output.writeInt(t.value.length);
    for (var i = 0; i < t.value.length; i++) {
        output.writeInt(t.value.charCodeAt(i));
    }
};

CustomSerializer.prototype.read = function (reader) {
    var len = reader.readInt();
    var str = '';
    for (var i = 0; i < len; i++) {
        str = str + String.fromCharCode(reader.readInt());
    }
    return new CustomSerializable(str);
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.customSerializers.push(new CustomSerializer());

// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    //CustomSerializer will serialize/deserialize CustomSerializable objects
    hz.shutdown();
});

