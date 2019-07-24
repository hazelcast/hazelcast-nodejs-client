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

function OrderKey(orderId, customerId) {
    this.orderId = orderId;
    this.customerId = customerId;
}

OrderKey.prototype.getPartitionKey = function () {
    return this.customerId;
};

var Client = require('hazelcast-client').Client;;
var mapCustomers;
var mapOrders;
var customer, order;

Client.newHazelcastClient().then(function (client) {
    Client = client;
    return Client.getMap('customers');
}).then(function (mp) {
    mapCustomers = mp;
    return Client.getMap('orders');
}).then(function (mp) {
    mapOrders = mp;
    customer = new OrderKey(1,1);
    return mapCustomers.put(1,customer);
}).then(function (value) {
    order =new OrderKey(3,1);
    console.log('order: ',order);
    console.log('customer: ',customer);
    return mapOrders.putAll([
        [new OrderKey(21,1), order],
        [new OrderKey(22,1), order],
        [new OrderKey(23,1), order]
    ]).then(function () {
        return Client.shutdown();
    });
});
