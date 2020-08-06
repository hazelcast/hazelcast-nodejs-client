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
const Promise = require('bluebird');

const Client = require('../../.').Client;
const RC = require('../RC');
const SimplePortable = require('./PortableObjects').SimplePortable;
const InnerPortable = require('./PortableObjects').InnerPortableObject;

describe('PortableSerializersLiveTest', function () {

    let cluster, client;
    let map;

    function getClientConfig(clusterName) {
        return {
            clusterName,
            serialization: {
                portableFactories: {
                    10: {
                        create: function (classId) {
                            if (classId === 222) {
                                return new InnerPortable();
                            } else if (classId === 21) {
                                return new SimplePortable();
                            } else {
                                return null;
                            }
                        }
                    }
                }
            }
        };
    }

    before(function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function (m) {
            return Client.newHazelcastClient(getClientConfig(cluster.id));
        }).then(function (cl) {
            client = cl;
            return client.getMap('test');
        }).then(function (mp) {
            map = mp;
        });
    });

    after(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('client can write and read two different serializable objects of the same factory', function () {
        const simplePortable = new SimplePortable('atext');
        const innerPortable = new InnerPortable('str1', 'str2');
        return map.put('simpleportable', simplePortable).then(function () {
            return map.put('innerportable', innerPortable);
        }).then(function () {
            return map.get('simpleportable');
        }).then(function (sp) {
            return map.get('innerportable').then(function (ip) {
                expect(sp).to.deep.equal(simplePortable);
                expect(ip).to.deep.equal(innerPortable);
                return Promise.resolve();
            });
        });
    });

    it('client can read two different serializable objects of the same factory (written by another client)', function () {
        const simplePortable = new SimplePortable('atext');
        const innerPortable = new InnerPortable('str1', 'str2');
        return map.putAll([['simpleportable', simplePortable], ['innerportable', innerPortable]]).then(function () {
            client.shutdown();
        }).then(function () {
            return Client.newHazelcastClient(getClientConfig(cluster.id));
        }).then(function (cl) {
            client = cl;
            return client.getMap('test');
        }).then(function (mp) {
            map = mp;
            return map.get('simpleportable');
        }).then(function (sp) {
            return map.get('innerportable').then(function (ip) {
                expect(sp).to.deep.equal(simplePortable);
                expect(ip).to.deep.equal(innerPortable);
                return Promise.resolve();
            });
        });
    });

});
