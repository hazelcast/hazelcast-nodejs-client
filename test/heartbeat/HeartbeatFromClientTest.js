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

var RC = require('../RC');
var HazelcastClient = require('../../').Client;
var expect = require('chai').expect;
var Config = require('../../').Config;
var Util = require('../Util');
var fs = require('fs');

describe('HeartbeatFromClientTest', function () {
    this.timeout(30000);

    var cluster;

    beforeEach(function () {
        var serverConfig = fs.readFileSync(__dirname + '/short-heartbeat.xml', 'utf8');
        return RC.createCluster(null, serverConfig).then(function (resp) {
            cluster = resp;
        });
    });

    afterEach(function () {
        return RC.shutdownCluster(cluster.id);
    });

    it('client sends heartbeat periodically even when server continuously pushes messages', function () {
        var MAP_NAME = 'testmap';
        var member;
        var client1;
        var client2;
        var connectionClosedEventCount = 0;

        var mapFromClient1;
        var mapFromClient2;
        var pushTask;

        var clientConfig = new Config.ClientConfig();
        clientConfig.properties['hazelcast.client.heartbeat.interval'] = 1000;
        return RC.startMember(cluster.id).then(function (m) {
            member = m;
            return HazelcastClient.newHazelcastClient(clientConfig);
        }).then(function (c) {
            client1 = c;
            client1.getConnectionManager().on('connectionClosed', function () {
                connectionClosedEventCount++;
            });
            return HazelcastClient.newHazelcastClient(clientConfig);
        }).then(function (c) {
            client2 = c;
            return client1.getMap(MAP_NAME);
        }).then(function (m) {
            mapFromClient1 = m;
            return mapFromClient1.addEntryListener({
                added: function () {
                    //no-op
                },
                updated: function () {
                    //no-op
                }
            })
        }).then(function () {
            return client2.getMap(MAP_NAME);
        }).then(function (m) {
            var counter = 0;
            mapFromClient2 = m;
            pushTask = setInterval(function () {
                mapFromClient2.put('testkey', counter++);
            }, 1000);
            return Util.promiseLater(15000, function () {});
        }).then(function () {
            clearInterval(pushTask);
            expect(connectionClosedEventCount).to.equal(0);
        });
    });
});



