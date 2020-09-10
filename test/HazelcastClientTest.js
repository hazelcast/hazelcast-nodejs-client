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
'use strict';

const expect = require('chai').expect;
const RC = require('./RC');
const { Client } = require('../.');
const { deferredPromise } = require('../lib/util/Util');

const dummyConfig = {
    network: {
        smartRouting: false
    }
};
const smartConfig = {
    network: {
        smartRouting: true
    }
};
const configParams = [
    dummyConfig,
    smartConfig
];

function ManagedObjects() {
    this.managedObjects = [];
}

ManagedObjects.prototype.getObject = function (func, name) {
    return func(name).then((obj) => {
        this.managedObjects.push(obj);
        return obj;
    });
};

ManagedObjects.prototype.destroyAll = function () {
    const promises = [];
    this.managedObjects.forEach(function (obj) {
        promises.push(obj.destroy());
    });
    return Promise.all(promises);
};

ManagedObjects.prototype.destroy = function (name) {
    const deferred = deferredPromise();
    this.managedObjects.filter((el) => {
        if (el.getName() === name) {
            el.destroy().then(function () {
                deferred.resolve();
            });
        }
    });
    return deferred.promise;
};

configParams.forEach(function (cfg) {
    describe('HazelcastClient', function () {
        this.timeout(4000);
        let cluster, client, managed;

        before(function () {
            return RC.createCluster(null, null).then(function (res) {
                cluster = res;
                return RC.startMember(cluster.id);
            }).then(function (member) {
                cfg.clusterName = cluster.id;
                return Client.newHazelcastClient(cfg);
            }).then(function (res) {
                client = res;
            });
        });

        beforeEach(function () {
            managed = new ManagedObjects();
        });

        afterEach(function () {
            return managed.destroyAll();
        });

        after(function () {
            return client.shutdown()
                .then(() => RC.terminateCluster(cluster.id));
        });

        it('getDistributedObject returns empty array when there is no distributed object', function () {
            return client.getDistributedObjects().then(function (distributedObjects) {
                return Promise.all([
                    expect(distributedObjects).to.be.an('array'),
                    expect(distributedObjects).to.be.empty
                ]);
            });
        });

        it('getLocalEndpoint returns correct info', function () {
            const info = client.getLocalEndpoint();
            expect(info.localAddress.host).to.equal(client.getConnectionManager().getRandomConnection().localAddress.host);
            expect(info.localAddress.port).to.equal(client.getConnectionManager().getRandomConnection().localAddress.port);
            expect(info.uuid).to.deep.equal(client.getConnectionManager().getClientUuid());
            expect(info.type).to.equal('NodeJS');
            expect(info.labels).to.deep.equal(new Set());
        });

        it('getDistributedObjects returns all dist objects', function (done) {
            managed.getObject(client.getMap.bind(client, 'map'));
            managed.getObject(client.getSet.bind(client, 'set'));
            setTimeout(function () {
                client.getDistributedObjects().then(function (distObjects) {
                    try {
                        const names = distObjects.map((o) => {
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

        it('getDistributedObjects does not return removed object', function (done) {
            managed.getObject(client.getMap.bind(client, 'map1'));
            managed.getObject(client.getMap.bind(client, 'map2'));
            managed.getObject(client.getMap.bind(client, 'map3'));

            setTimeout(function () {
                managed.destroy('map1').then(function () {
                    client.getDistributedObjects().then(function (distObjects) {
                        try {
                            const names = distObjects.map(function (o) {
                                return o.getName();
                            });
                            expect(names).to.have.members(['map2', 'map3']);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
                });
            }, 300);
        });
    });
});
