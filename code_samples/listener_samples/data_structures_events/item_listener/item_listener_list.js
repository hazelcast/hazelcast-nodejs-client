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

var itemListener = {

    itemAdded: function (itemEvent) {
        console.log('Item Added:', itemEvent.item);
    },
    itemRemoved: function (itemEvent) {
        console.log('Item Removed:', itemEvent.item);
    }
};

Client.newHazelcastClient().then(function (hz) {
    hz.getList('item-listener-list').then(function (l) {
        var list = l;
        return list.clear().then(function () {
            return list.addItemListener(itemListener, true);
        }).then(function () {
                return list.add('Item1');
            }).then(function () {
                return list.add('Item2');
            }).then(function () {
                return list.add('Item3');
            }).then(function () {
                return list.add('Item4');
            }).then(function () {
                return list.remove('Item1');
            }).then(function () {
                return list.remove('Item2');
            }).then(function () {
                return list.toArray();
            }).then(function (values) {
                console.log(values);
            }).then(function(){
                return hz.shutdown();
            });
    });
});
