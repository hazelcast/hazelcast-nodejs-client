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

/**
 * JSON serialization is not capable if handling circular references.
 * We will use Mousse serializer to serialize our self referring objects.
 */
var mousse = require('mousse');
var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;
var cfg = new Config.ClientConfig();
cfg.serializationConfig.globalSerializer = {
    mousseSerialize: mousse.serialize,
    mousseDeserialize: mousse.deserialize,
    getId: function () {
        return 10;
    },
    write: function (out, obj) {
        out.writeUTF(this.mousseSerialize(obj))
    },
    read: function (inp) {
        var representation = inp.readUTF();
        return this.mousseDeserialize(representation).then(function (obj) {
            return obj;
        });
    }
};

var selfReferringObject = {
    value: 10
};
selfReferringObject.self = selfReferringObject;

Client.newHazelcastClient(cfg).then(function (client) {
    var map;
    client.getMap('objects').then(function (mp) {
        map = mp;
        return map.put(1, selfReferringObject);
    }).then(function () {
        return map.get(1);
    }).then(function (obj) {
        console.log(obj);
        console.log(obj.self);
        console.log(obj.self.self);
        client.shutdown();
    })
});



