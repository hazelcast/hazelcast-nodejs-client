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

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = require('chai').expect;
const Client = require('../../.').Client;
const Config = require('../../.').Config;
const Controller = require('../RC');
const Util = require('../Util');

describe('DistributedObjectsTest', function () {

    this.timeout(32000);

    let cluster;
    let client;

    const toNamespace = (distributedObjects) => {
        return distributedObjects.map((distObj) => distObj.getServiceName() + distObj.getName());
    }

    beforeEach(function () {
        return Controller.createCluster(null, null)
            .then((c) => {
                cluster = c;
                return Controller.startMember(cluster.id);
            })
            .then(() => {
                const config = new Config.ClientConfig();
                config.clusterName = cluster.id;
                return Client.newHazelcastClient(config);
            })
            .then((c) => {
                client = c;
            });
    });

    afterEach(function () {
        client.shutdown();
        return Controller.terminateCluster(cluster.id);
    });

    it('get distributed objects with no object on cluster', function () {
        return client.getDistributedObjects()
            .then((objects) => {
                expect(objects).to.have.lengthOf(0);
            });
    });

    it('get distributed objects', function () {
        let map, set, queue;

        return client.getMap(Util.randomString())
            .then((m) => {
                map = m;
                return client.getSet(Util.randomString());
            })
            .then((s) => {
                set = s;
                return client.getQueue(Util.randomString());
            })
            .then((q) => {
                queue = q;
                return client.getDistributedObjects();
            })
            .then((objects) => {
                expect(objects).to.have.deep.members([map, set, queue]);
                return client.getDistributedObjects();
            })
            .then((objects) => {
                // Make sure that live objects are not deleted
                expect(objects).to.have.deep.members([map, set, queue]);
            });
    });

    it('get distributed objects creates local instances of received proxies', function () {
        let map, set, queue;
        let otherClient;

        return client.getMap(Util.randomString())
            .then((m) => {
                map = m;
                return client.getSet(Util.randomString());
            })
            .then((s) => {
                set = s;
                return client.getQueue(Util.randomString());
            })
            .then((q) => {
                queue = q;
                return client.getDistributedObjects();
            })
            .then((objects) => {
                expect(objects).to.have.deep.members([map, set, queue]);

                const config = new Config.ClientConfig();
                config.clusterName = cluster.id;

                return Client.newHazelcastClient(config);
            })
            .then((c) => {
                otherClient = c;
                return otherClient.getDistributedObjects();
            })
            .then((objects) => {
                // Proxies have different clients, therefore deep equality check fails.
                // Namespace check should be enough
                expect(toNamespace(objects)).to.have.deep.members(toNamespace([map, set, queue]));
                return otherClient.getDistributedObjects();
            })
            .then((objects) => {
                // Make sure that live objects are not deleted
                expect(toNamespace(objects)).to.have.deep.members(toNamespace([map, set, queue]));
                otherClient.shutdown();
            });
    });

    it('get distributed objects should clear local instances of destroyed proxies', function () {
        let map, set, queue;
        let otherClient;

        const config = new Config.ClientConfig();
        config.clusterName = cluster.id;

        return Client.newHazelcastClient(config)
            .then((c) => {
                otherClient = c;
                return client.getMap(Util.randomString())
            })
            .then((m) => {
                map = m;
                return otherClient.getSet(Util.randomString());
            })
            .then((s) => {
                set = s;
                return client.getQueue(Util.randomString());
            })
            .then((q) => {
                queue = q;
                return client.getDistributedObjects();
            })
            .then((objects) => {
                expect(toNamespace(objects)).to.have.deep.members(toNamespace([map, set, queue]));
                return map.destroy();
            })
            .then(() => {
                return client.getDistributedObjects();
            })
            .then((objects) => {
                expect(toNamespace(objects)).to.have.deep.members(toNamespace([set, queue]));
                return set.destroy();
            })
            .then(() => {
                return client.getDistributedObjects();
            })
            .then((objects) => {
                expect(toNamespace(objects)).to.have.deep.members(toNamespace([queue]));
                return queue.destroy();
            })
            .then(() => {
                return client.getDistributedObjects();
            })
            .then((objects) => {
                expect(objects).to.have.lengthOf(0);
                return otherClient.getDistributedObjects();
            })
            .then((objects) => {
                expect(objects).to.have.lengthOf(0);
                otherClient.shutdown();
            });
    });
});
