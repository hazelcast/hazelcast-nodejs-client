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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const RC = require('../../RC');
const { IndeterminateOperationStateError } = require('../../../../lib');
const { ClientLocalBackupListenerCodec } = require('../../../../lib/codec/ClientLocalBackupListenerCodec');
const TestUtil = require('../../../TestUtil');

/**
 * Tests backup acks to client (a.k.a. boomerang backups).
 *
 * Data structures use sync backups with backup count `1` by default,
 * so there is no need for additional member side configuration.
 */
describe('ClientBackupAcksTest', function () {
    let cluster;
    let client;
    let members;

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        cluster = await testFactory.createClusterForParallelTests();
        const member1 = await RC.startMember(cluster.id);
        const member2 = await RC.startMember(cluster.id);
        members = [member1, member2];
    });

    afterEach(async function () {
        sandbox.restore();
        await client.shutdown();
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('should receive backup acks in smart mode', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.operation.fail.on.indeterminate.state': true,
                'hazelcast.client.operation.backup.timeout.millis': 7000
            }
        }, members);
        const map = await client.getMap('test-map');

        // TODO(puzpuzpuz): remove the next line once
        // https://github.com/hazelcast/hazelcast/issues/9398 is fixed
        await map.get('foo');

        // it's enough for this operation to succeed
        await map.set('foo', 'bar');
    });

    it('should throw when backup acks were lost in smart mode when prop is set', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.operation.backup.timeout.millis': 300,
                'hazelcast.client.operation.fail.on.indeterminate.state': true
            }
        }, members);
        // replace backup ack handler with a fake to emulate backup acks loss
        sandbox.replace(ClientLocalBackupListenerCodec, 'handle', sinon.fake());
        const map = await client.getMap('test-map');

        await expect(map.set('foo', 'bar')).to.be.rejectedWith(IndeterminateOperationStateError);
    });

    it('should not throw when backup acks were lost in smart mode when prop is not set', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.operation.backup.timeout.millis': 300
            }
        }, members);
        // replace backup ack handler with a fake to emulate backup acks loss
        sinon.replace(ClientLocalBackupListenerCodec, 'handle', sinon.fake());
        const map = await client.getMap('test-map');

        // it's enough for this operation to succeed
        await map.set('foo', 'bar');
    });

    it('should receive ack in smart mode when acks to client are disabled', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            backupAckToClientEnabled: false
        }, members);
        const map = await client.getMap('test-map');

        // it's enough for this operation to succeed
        await map.set('foo', 'bar');
    });

    it('should receive ack in unisocket mode', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            network: {
                smartRouting: false
            }
        }, members);
        const map = await client.getMap('test-map');

        // it's enough for this operation to succeed
        await map.set('foo', 'bar');
    });
});
