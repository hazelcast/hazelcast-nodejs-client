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

var RC = require('./RC');
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;
var expect = require('chai').expect;


[true, false].forEach(function (isSmartService) {
    describe('ListenerService[smart=' + isSmartService + ']', function () {
        var cluster;
        var client;

        before(function () {
            return RC.createCluster(null, null).then(function (res) {
                cluster = res;
                return Promise.resolve(cluster.id);
            }).then(function (clusterId) {
                return RC.startMember(clusterId)
            }).then(function () {
                var cfg = new Config.ClientConfig();
                cfg.networkConfig.smartRouting = isSmartService;
                return HazelcastClient.newHazelcastClient(cfg);
            }).then(function (res) {
                client = res;
            });
        });

        after(function () {
            client.shutdown();
            return RC.shutdownCluster(cluster.id);
        });

        it('listener is invoked when a new object is created', function (done) {
            client.addDistributedObjectListener(function (name, serviceName, eventType) {
                if (eventType === 'created' && name === 'mapToListen') {
                    expect(serviceName).to.eq('hz:impl:mapService');
                    done();
                }
            }).then(function () {
                client.getMap('mapToListen');
            });
        });

        it('listener is invoked when an object is removed[smart=' + isSmartService + ']', function (done) {
            var map;
            client.addDistributedObjectListener(function (name, serviceName, eventType) {
                if (eventType === 'destroyed' && name === 'mapToRemove') {
                    expect(serviceName).to.eq('hz:impl:mapService');
                    done();
                } else if (eventType === 'created' && name === 'mapToRemove') {
                    map.destroy();
                }
            }).then(function () {
                map = client.getMap('mapToRemove');
            });
        });

        it('listener is not invoked when listener was already removed by user', function (done) {
            this.timeout(3000);
            client.addDistributedObjectListener(function (name, serviceName, eventType) {
                done('Should not have run!');
            }).then(function (listenerId) {
                return client.removeDistributedObjectListener(listenerId)
            }).then(function () {
                setTimeout(done, 1000);
            });
        });
    });

});
