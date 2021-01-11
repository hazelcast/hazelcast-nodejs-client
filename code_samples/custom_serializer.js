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
var Config = require('hazelcast-client').Config;
var cfg = new Config.ClientConfig();

function TimeOfDay(hour, minute, second) {
    this.hour = hour;
    this.minute = minute;
    this.second = second;
}

TimeOfDay.prototype.hzGetCustomId = function () {
    return 42;
};

var CustomSerializer = {
    getId: function () {
        return 42;
    },
    write: function (out, timeofday) {
        var secondPoint = (timeofday.hour * 60 + timeofday.minute) * 60 + timeofday.second;
        out.writeInt(secondPoint);
    },
    read: function (inp) {
        var obj = new TimeOfDay();
        var unit = inp.readInt();
        obj.second = unit % 60;
        unit = (unit - obj.second) / 60;
        obj.minute = unit % 60;
        unit = (unit - obj.minute) / 60;
        obj.hour = unit;
        obj.customDeserialized = true;
        return obj;
    }
};

var giveInformation = function (timeofday) {
    console.log('-------------------');
    console.log('Custom deserialized: ' + !!(timeofday.customDeserialized));
    console.log('Hour: ' + timeofday.hour);
    console.log('Minute: ' + timeofday.minute);
    console.log('Second: ' + timeofday.second);
    console.log('-------------------');
};

cfg.serializationConfig.customSerializers.push(CustomSerializer);
Client.newHazelcastClient(cfg).then(function (client) {
    var map;
    var t = new TimeOfDay(5, 32, 59);
    giveInformation(t);
    client.getMap('time').then(function (mp) {
        map = mp;
        return map.put(1, t)
    }).then(function () {
        return map.get(1);
    }).then(function (deserialized) {
        giveInformation(deserialized);
        client.shutdown();
    });
});
