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
'use strict';

const fs = require('fs');
const expect = require('chai').expect;
const RC = require('../RC');
const Util = require('../Util');
const { Client } = require('../../');

describe('HeartbeatFromClientTest', function () {

    let cluster;

    beforeEach(function () {
        const serverConfig = fs.readFileSync(__dirname + '/short-heartbeat.xml', 'utf8');
        return RC.createCluster(null, serverConfig).then(function (resp) {
            cluster = resp;
        });
    });

    afterEach(function () {
        return RC.terminateCluster(cluster.id);
    });

    it('client sends heartbeat periodically even when server continuously pushes messages', function () {
        const MAP_NAME = 'testmap';
        let client1, client2;
        let connectionClosedEventCount = 0;

        let mapFromClient1;
        let mapFromClient2;
        let pushTask;

        const clientConfig = {
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.heartbeat.interval': 1000
            }
        };
        return RC.startMember(cluster.id).then(function (m) {
            return Client.newHazelcastClient(clientConfig);
        }).then(function (c) {
            client1 = c;
            client1.getConnectionManager().on('connectionClosed', function () {
                connectionClosedEventCount++;
            });
            return Client.newHazelcastClient(clientConfig);
        }).then(function (c) {
            client2 = c;
            return client1.getMap(MAP_NAME);
        }).then(function (m) {
            mapFromClient1 = m;
            return mapFromClient1.addEntryListener({
                added: function () {
                    // no-op
                },
                updated: function () {
                    // no-op
                }
            })
        }).then(function () {
            return client2.getMap(MAP_NAME);
        }).then(function (m) {
            let counter = 0;
            mapFromClient2 = m;
            pushTask = setInterval(function () {
                mapFromClient2.put('testkey', counter++);
            }, 1000);
            return Util.promiseLater(15000, () => {});
        }).then(function () {
            clearInterval(pushTask);
            expect(connectionClosedEventCount).to.equal(0);
            return client1.shutdown();
        }).then(function () {
            return client2.shutdown();
        });
    });
});



