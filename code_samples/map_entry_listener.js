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
var listener = {
    added: function (entryEvent) {
        console.log('added key: ' + entryEvent.key + ', new value: ' + entryEvent.value
            + ', old value: ' + entryEvent.oldValue);
    },
    removed: function (entryEvent) {
        console.log('removed key: ' + entryEvent.key + ', new value: ' + entryEvent.value
            + ', old value: ' + entryEvent.oldValue);
    }
};

var pushNotification = function (map, key, value) {
    return map.put(key, value);
};

var removeNotification = function (map, key) {
    return map.remove(key);
};

Client.newHazelcastClient().then(function (client) {
    var map;
    client.getMap('notifications').then(function (mp) {
        map = mp;
        return map.addEntryListener(listener, undefined, true);
    }).then(function () {
        return pushNotification(map, 1, 'new-value');
    }).then(function () {
        return removeNotification(map, 1);
    }).then(function () {
        client.shutdown();
    });
});
