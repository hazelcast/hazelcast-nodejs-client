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

const { expect } = require('chai');
const RC = require('../RC');
const { Client } = require('../../../');
const TestUtil = require('../../TestUtil');

[true, false].forEach((isSmartService) => {
    describe('ListenerServiceTest[smart=' + isSmartService + ']', function () {

        let cluster;
        let client;

        function detectListenerLeakScript(instanceVar, listenerId) {
            return 'var clientEngine = ' + instanceVar +'.getOriginal().node.clientEngine;\n'
                + 'var endpoints = clientEngine.getEndpointManager().getEndpoints();\n'
                + 'var endpoint = endpoints.iterator().next();\n'
                + 'var registrationUuid = java.util.UUID.fromString("' + listenerId + '");\n'
                + 'result = "" + endpoint.removeDestroyAction(registrationUuid);\n';
        }

        before(async function () {
            cluster = await RC.createCluster(null, null);
            await RC.startMember(cluster.id);
        });

        beforeEach(async function () {
            client = await Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    smartRouting: isSmartService
                }
            });
        });

        afterEach(async function () {
            await client.shutdown();
        });

        after(async function () {
            await RC.terminateCluster(cluster.id);
        });

        it('listener is invoked when new object is created[smart=' + isSmartService + ']', function (done) {
            let listenerId;
            client.addDistributedObjectListener((distributedObjectEvent) => {
                expect(distributedObjectEvent.objectName).to.eq('mapToListen');
                expect(distributedObjectEvent.serviceName).to.eq('hz:impl:mapService');
                expect(distributedObjectEvent.eventType).to.eq('created');
                client.removeDistributedObjectListener(listenerId).then(() => done());
            }).then((id) => {
                listenerId = id;
                client.getMap('mapToListen').catch(() => {
                    // the event may come earlier than the getMap response,
                    // so we ignore errors here
                });
            }).catch(done);
        });

        it('listener is invoked when object is removed[smart=' + isSmartService + ']', function (done) {
            let map, listenerId;
            client.addDistributedObjectListener((distributedObjectEvent) => {
                if (distributedObjectEvent.eventType === 'destroyed'
                        && distributedObjectEvent.objectName === 'mapToRemove') {
                    expect(distributedObjectEvent.objectName).to.eq('mapToRemove');
                    expect(distributedObjectEvent.serviceName).to.eq('hz:impl:mapService');
                    expect(distributedObjectEvent.eventType).to.eq('destroyed');
                    client.removeDistributedObjectListener(listenerId).then(() => done());
                } else if (distributedObjectEvent.eventType === 'created'
                        && distributedObjectEvent.objectName === 'mapToRemove') {
                    TestUtil.promiseWaitMilliseconds(1000).then(() => {
                        map.destroy().catch(() => {
                            // no-op
                        });
                    });
                }
            }).then((id) => {
                listenerId = id;
                return client.getMap('mapToRemove').then((mp) => {
                    map = mp;
                });
            }).catch(done);
        });

        it('listener is not invoked when it is removed[smart=' + isSmartService + ']', function (done) {
            let listenerId;
            client.addDistributedObjectListener(() => {
                done(new Error('Should not have run!'));
            }).then((id) => {
                listenerId = id;
                return client.removeDistributedObjectListener(listenerId);
            }).then(() => {
                return client.getMap('newMap');
            }).then(() => {
                setTimeout(() => {
                    const script = detectListenerLeakScript('instance_0', listenerId);
                    RC.executeOnController(cluster.id, script, 1).then((res) => {
                        expect(res.result).to.not.be.null;
                        expect(res.result.toString()).to.be.equal('false');
                        done();
                    }).catch(done);
                }, 1000);
            }).catch(done);
        });

        it('listener is not invoked when it is removed and new member starts[smart=' + isSmartService + ']', function (done) {
            let listenerId;
            let member2Promise;
            client.addDistributedObjectListener(() => {
                done(new Error('Should not have run!'));
            }).then((id) => {
                listenerId = id;
                member2Promise = RC.startMember(cluster.id);
                return client.removeDistributedObjectListener(listenerId);
            }).then(() => {
                return client.getMap('anotherNewMap');
            }).then(() => {
                member2Promise.then((member2) => {
                    setTimeout(() => {
                        // we're interested in the second member here
                        const script = detectListenerLeakScript('instance_1', listenerId);
                        RC.executeOnController(cluster.id, script, 1).then((res) => {
                            expect(res.result).to.not.be.null;
                            expect(res.result.toString()).to.be.equal('false');
                            // need to clean up the second member before finishing the test
                            RC.shutdownMember(cluster.id, member2.uuid).then(() => done());
                        }).catch(done);
                    }, 3000);
                }).catch(done);
            }).catch(done);
        });
    });
});
