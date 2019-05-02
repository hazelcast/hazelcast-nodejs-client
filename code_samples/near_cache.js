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
var EvictionPolicy = require('hazelcast-client').EvictionPolicy;

var nearCachedMapName = 'nearCachedMap';
var regularMapName = 'reqularMap';
var client;

var cfg = new Config.ClientConfig();
var nearCacheConfig = new Config.NearCacheConfig();
nearCacheConfig.name = nearCachedMapName;
nearCacheConfig.evictionPolicy = EvictionPolicy.LFU;
nearCacheConfig.invalidateOnChange = true;
cfg.nearCacheConfigs[nearCachedMapName] = nearCacheConfig;

function do50000Gets(client, mapName) {
    var timerStart;
    var timerEnd;
    var map;

    return client.getMap(mapName).then(function (mp) {
        map = mp;
        return map.put('item', 'anItem');
    }).then(function () {
        // warm up the cache
        return client.getMap(mapName);
    }).then(function (mp) {
        map = mp;
        return map.get('item');
    }).then(function () {
        timerStart = Date.now();
        var requests = [];
        for (var i = 0; i < 50000; i++) {
            requests.push(client.getMap(mapName).then(function (mp) {
                map = mp;
                return map.get('item');
            }));
        }
        return Promise.all(requests);
    }).then(function () {
        timerEnd = Date.now();
        console.log('Took ' + (timerEnd - timerStart) + ' ms to do 50000 gets on ' + mapName + '.');
    });
}

Client.newHazelcastClient(cfg).then(function (cl) {
    client = cl;
    return do50000Gets(client, nearCachedMapName);
}).then(function () {
    return do50000Gets(client, regularMapName);
}).then(function () {
    client.shutdown();
});
