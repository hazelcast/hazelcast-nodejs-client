/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

var REQ_COUNT = 50000;
var ENTRY_COUNT = 10 * 1000;
var VALUE_SIZE = 10000;
var GET_PERCENTAGE = 40;
var PUT_PERCENTAGE = 40;
var value_string = '';
for (var i = 0; i < VALUE_SIZE; i++) {
    value_string = value_string + 'x';
}
var Test = {
    map: undefined,
    finishCallback: undefined,
    ops: 0,
    increment: function() {
        this.ops = this.ops + 1;
        if (this.ops === REQ_COUNT) {
            var date = new Date();
            this.run = function() {};
            this.finishCallback(date);
        }
    },
    run: function() {
        var key = Math.random() * ENTRY_COUNT;
        var opType = Math.floor(Math.random() * 100);
        if (opType < GET_PERCENTAGE ) {
            this.map.get(key).
                then(this.increment.bind(this));
        } else if (opType < GET_PERCENTAGE + PUT_PERCENTAGE) {
            this.map.put(key, value_string).
                then(this.increment.bind(this));
        } else {
            this.map.remove(key)
                .then(this.increment.bind(this));
        }
        setImmediate(this.run.bind(this));
    }
};
var Client = require('../.').Client;
Client.newHazelcastClient().then(function(hazelcastClient) {
    Test.map = hazelcastClient.getMap('default');
    var start;
    Test.finishCallback = function(finish) {
        console.log('Took ' + (finish - start)/1000 + ' seconds for ' + REQ_COUNT + ' requests');
        console.log('Ops/s: ' + REQ_COUNT / ((finish - start) / 1000));
        hazelcastClient.shutdown();
    };
    start = new Date();
    Test.run();
});
