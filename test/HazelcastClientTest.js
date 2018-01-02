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

var expect = require('chai').expect;
var Config = require('../.').Config;
var Controller = require('./RC');
var HazelcastClient = require('../.').Client;
var Promise = require('bluebird');

var dummyConfig = new Config.ClientConfig();
dummyConfig.networkConfig.smartRouting = false;

var smartConfig = new Config.ClientConfig();
smartConfig.networkConfig.smartRouting = true;

var configParams = [
    dummyConfig,
    smartConfig
];

function ManagedObjects() {
    this.managedObjects = [];
}

ManagedObjects.prototype.getObject = function (func, name) {
    var obj = func(name);
    this.managedObjects.push(obj);
    return obj;
};

ManagedObjects.prototype.destroyAll = function() {
    this.managedObjects.forEach(function (obj) {
        obj.destroy();
    });
};

ManagedObjects.prototype.destroy = function(name) {
    this.managedObjects.filter((el) => {
        if (el.getName() == name) {
            el.destroy();
            return false;
        }
        return true;
    });
};


configParams.forEach(function (cfg) {
    describe('HazelcastClient', function() {
        this.timeout(4000);
        var cluster;
        var client;
        var managed;

        before(function() {
            return Controller.createCluster(null, null).then(function(res) {
                cluster = res;
                return Controller.startMember(cluster.id);
            }).then(function (member) {
                return HazelcastClient.newHazelcastClient(cfg);
            }).then(function(res) {
                client = res;
            });
        });

        beforeEach(function () {
            managed = new ManagedObjects();
        });

        afterEach(function () {
            managed.destroyAll();
        });

        after(function() {
            client.shutdown();
            return Controller.shutdownCluster(cluster.id);
        });

        it('getDistributedObject returns empty array when there is no distributed object', function() {
            return client.getDistributedObjects().then(function(distributedObjects) {
                return Promise.all([
                    expect(distributedObjects).to.be.an('array'),
                    expect(distributedObjects).to.be.empty
                ]);
            });
        });

        it('getLocalEndpoint returns correct info', function() {
            var info = client.getLocalEndpoint();
            expect(info.localAddress.host).to.equal(client.clusterService.getOwnerConnection().localAddress.host);
            expect(info.localAddress.port).to.equal(client.clusterService.getOwnerConnection().localAddress.port);
            expect(info.uuid).to.equal(client.clusterService.uuid);
            expect(info.type).to.equal('NodeJS');
        });

        it('getDistributedObjects returns all dist objects', function (done) {
            managed.getObject(client.getMap.bind(client, 'map'));
            managed.getObject(client.getSet.bind(client, 'set'));
            setTimeout(function () {
                client.getDistributedObjects().then(function (distObjects) {
                    try {
                        names = distObjects.map((o) => {
                            return o.getName();
                        });
                        expect(names).to.have.members(['map', 'set']);
                        done();
                    } catch (e) {
                        done(e);
                    }
                })
            }, 300);
        });

        it('getDistributedObjects does not return removed object', function(done) {
            managed.getObject(client.getMap.bind(client, 'map1'));
            managed.getObject(client.getMap.bind(client, 'map2'));
            managed.getObject(client.getMap.bind(client, 'map3'));

            setTimeout(function () {
                managed.destroy('map1');
                client.getDistributedObjects().then(function (distObjects) {
                    try {
                        names = distObjects.map(function(o) {
                            return o.getName();
                        });
                        expect(names).to.have.members(['map2', 'map3']);
                        done();
                    } catch (e) {
                        done(e);
                    }
                })
            }, 300);
        });
    });

});
