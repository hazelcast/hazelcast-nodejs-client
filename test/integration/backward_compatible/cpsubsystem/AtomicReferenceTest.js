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
const fs = require('fs');

const RC = require('../../RC');
const {
    Client,
    DistributedObjectDestroyedError
} = require('../../../../');

describe('AtomicReferenceTest', function () {

    let cluster;
    let client;
    let ref;

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_cpsubsystem.xml', 'utf8'));
        await Promise.all([
            RC.startMember(cluster.id),
            RC.startMember(cluster.id),
            RC.startMember(cluster.id)
        ]);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
        ref = await client.getCPSubsystem().getAtomicReference('aref');
    });

    afterEach(async function () {
        // return to default value
        await ref.clear();
    });

    after(async function () {
        await client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('should create AtomicReference with respect to given CP group', async function () {
        const refInAnotherGroup = await client.getCPSubsystem().getAtomicReference('aref@mygroup');

        await refInAnotherGroup.set(42);
        let value = await refInAnotherGroup.get();
        expect(value).to.be.equal(42);

        value = await ref.get();
        expect(value).to.be.not.equal(42);
    });

    it('destroy: should destroy AtomicReference and throw on operation', async function () {
        const anotherRef = await client.getCPSubsystem().getAtomicReference('another-aref');
        await anotherRef.destroy();
        // the next destroy call should be ignored
        await anotherRef.destroy();

        await expect(anotherRef.get()).to.be.rejectedWith(DistributedObjectDestroyedError);
    });

    it('compareAndSet: should succeed on expected value match', async function () {
        let result = await ref.compareAndSet(null, 'foo');
        expect(result).to.be.true;

        result = await ref.compareAndSet('foo', { foo: 'bar' });
        expect(result).to.be.true;

        result = await ref.compareAndSet({ foo: 'bar' }, 42);
        expect(result).to.be.true;
    });

    it('compareAndSet: should not succeed on expected value mismatch', async function () {
        await ref.set('foo');

        const result = await ref.compareAndSet(42, 'bar');
        expect(result).to.be.false;
    });

    it('get: should return null when value not set yet', async function () {
        const value = await ref.get();
        expect(value).to.be.null;
    });

    it('set: should set string value', async function () {
        await ref.set('foo');
        const value = await ref.get();
        expect(value).to.be.equal('foo');
    });

    it('set: should set object value', async function () {
        await ref.set({ foo: 'bar' });
        const value = await ref.get();
        expect(value).to.be.deep.equal({ foo: 'bar' });
    });

    it('getAndSet: should return old value and set new one', async function () {
        let value = await ref.getAndSet('foo');
        expect(value).to.be.null;

        value = await ref.getAndSet('bar');
        expect(value).to.be.equal('foo');

        value = await ref.get();
        expect(value).to.be.equal('bar');
    });

    it('isNull: should return true when null', async function () {
        const isNull = await ref.isNull();
        expect(isNull).to.be.true;
    });

    it('isNull: should return false when not null', async function () {
        await ref.set('foo');
        const isNull = await ref.isNull();
        expect(isNull).to.be.false;
    });

    it('clear: should reset value to null', async function () {
        await ref.set('foo');
        await ref.clear();
        const isNull = await ref.isNull();
        expect(isNull).to.be.true;
    });

    it('contains: should return true on matching values', async function () {
        let result = await ref.contains(null);
        expect(result).to.be.true;

        await ref.set('foo');
        result = await ref.contains('foo');
        expect(result).to.be.true;

        await ref.set({ foo: 'bar' });
        result = await ref.contains({ foo: 'bar' });
        expect(result).to.be.true;
    });

    it('contains: should return false on non-matching values', async function () {
        await ref.set(42);

        let result = await ref.contains('foo');
        expect(result).to.be.false;

        result = await ref.contains({ foo: 'bar' });
        expect(result).to.be.false;

        result = await ref.contains(null);
        expect(result).to.be.false;
    });
});
