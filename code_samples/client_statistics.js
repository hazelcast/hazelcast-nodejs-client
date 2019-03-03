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
var Config = require('hazelcast-client').Config;

function createConfig() {
    var cfg = new Config.ClientConfig();

    var nearCacheConfig = new Config.NearCacheConfig();
    cfg.nearCacheConfigs['nearCachedMap'] = nearCacheConfig;
    cfg.properties['hazelcast.client.statistics.enabled'] = true;
    cfg.properties['hazelcast.client.statistics.period.seconds'] = 2;
    return cfg;
}

Client.newHazelcastClient(createConfig()).then(function (client) {
    var ncMap;
    return client.getMap('nearCachedMap').then(function (map) {
        ncMap = map;
        return ncMap.put('key1', 'value1');
    }).then(function () {
        return ncMap.get('key1');
    }).then(function () {
        return ncMap.get('key1');
    }).then(function () {
        return ncMap.get('key1');
    }).then(function () {
        // At this point, we have 1 near cache miss, 2 near cache hits as client near cache statistics.
        // Sleep more than statistics collection time and keep client running. Then, you can see the statistics
        // at the Management center.
        setTimeout(function () {
            client.shutdown();
        }, 60000);
    });
});
