/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const Long = require('long');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
chai.use(require('chai-as-promised'));
const should = chai.should();

const RC = require('../../../../RC');
const TestUtil = require('../../../../../TestUtil');
const CompactUtil = require('./CompactUtil');
const { Predicates } = require('../../../../../../lib');

let compactSerializerUsed = false;

class CompactReturningAggregator {
}

class CompactReturningAggregatorSerializer {
    getClass() {
        return CompactReturningAggregator;
    }

    getTypeName() {
        return 'com.hazelcast.serialization.compact.CompactReturningAggregator';
    }

    read() {
        compactSerializerUsed = true;
        return new CompactReturningAggregator();
    }

    write() {
        compactSerializerUsed = true;
    }
}

class CompactPredicate {
}

class CompactPredicateSerializer {
    getClass() {
        return CompactPredicate;
    }

    getTypeName() {
        return 'com.hazelcast.serialization.compact.CompactPredicate';
    }

    read() {
        compactSerializerUsed = true;
        return new CompactPredicate();
    }

    write() {
        compactSerializerUsed = true;
    }
}

class InnerCompact {
    constructor(stringField) {
        this.stringField = stringField;
    }
}

class InnerCompactSerializer {
    getClass() {
        return InnerCompact;
    }

    getTypeName() {
        return 'com.hazelcast.serialization.compact.InnerCompact';
    }

    read(reader) {
        compactSerializerUsed = true;
        const stringField = reader.readString('stringField');
        return new InnerCompact(stringField);
    }

    write(writer, instance) {
        compactSerializerUsed = true;
        writer.writeString('stringField', instance.stringField);
    }
}

class OuterCompact {
    constructor(intField, innerField) {
        this.intField = intField;
        this.innerField = innerField;
    }
}

class OuterCompactSerializer {
    getClass() {
        return OuterCompact;
    }

    getTypeName() {
        return 'com.hazelcast.serialization.compact.OuterCompact';
    }

    read(reader) {
        compactSerializerUsed = true;
        const intField = reader.readInt32('intField');
        const innerField = reader.readCompact('innerField');
        return new OuterCompact(intField, innerField);
    }

    write(writer, instance) {
        compactSerializerUsed = true;
        writer.writeInt32('intField', instance.intField);
        writer.writeCompact('innerField', instance.innerField);
    }
}

class CompactReturningEntryProcessor {
}

class CompactReturningEntryProcessorSerializer {
    getClass() {
        return CompactReturningEntryProcessor;
    }

    getTypeName() {
        return 'com.hazelcast.serialization.compact.CompactReturningEntryProcessor';
    }

    read() {
        compactSerializerUsed = true;
        return new CompactReturningEntryProcessor();
    }

    write() {
        compactSerializerUsed = true;
    }
}

/**
 * Tests all Public APIs if they can serialize compact objects and if they throw the errors right away other
 * than the SchemaNotReplicatedError.
 */
describe('CompactPublicAPIsTest', function () {
    let cluster;
    let member;
    let client;
    let map, multimap, list, atomicReference,
        queue, set, topic, nearCachedMap1, nearCachedMap2,
        replicatedMap, ringBuffer;
    let employee;
    let SchemaNotReplicatedError;
    let clientConfig;
    let skipped = false;

    let CLUSTER_CONFIG_XML = `
        <hazelcast xmlns="http://www.hazelcast.com/schema/config"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.hazelcast.com/schema/config
            http://www.hazelcast.com/schema/config/hazelcast-config-5.0.xsd">
            <network>
                <port>0</port>
            </network>
            <serialization>
                <compact-serialization/>
            </serialization>
        </hazelcast>
    `;

    const INNER_INSTANCE = new InnerCompact('42');
    const OUTER_INSTANCE = new OuterCompact(42, INNER_INSTANCE);
    const OUTER_INSTANCE2 = new OuterCompact(43, new InnerCompact('43'));
    const testFactory = new TestUtil.TestFactory();
    const pagingPredicate = Predicates.paging(new CompactPredicate(), 1);

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        employee = new CompactUtil.Employee(1, Long.ONE);
        if ((await TestUtil.compareServerVersionWithRC(RC, '5.1.0')) < 0) {
            skipped = true;
            this.skip();
        }
        // Compact serialization 5.2 server is not compatible with clients older than 5.2
        if ((await TestUtil.compareServerVersionWithRC(RC, '5.2.0')) >= 0 && !TestUtil.isClientVersionAtLeast('5.2.0')) {
            skipped = true;
            this.skip();
        }
        if ((await TestUtil.compareServerVersionWithRC(RC, '5.2.0')) < 0) {
            CLUSTER_CONFIG_XML = CLUSTER_CONFIG_XML
            .replace('<compact-serialization/>', '<compact-serialization enabled="true"/>');
        }
        cluster = await testFactory.createClusterForParallelTests(null, CLUSTER_CONFIG_XML);
        member = await RC.startMember(cluster.id);
        SchemaNotReplicatedError = require('../../../../../../lib').SchemaNotReplicatedError;
    });

    beforeEach(async function () {
        skipped = false;
        const name = TestUtil.randomString(12);

        clientConfig = {
            clusterName: cluster.id,
            serialization: {
                compact: {
                    serializers: [
                        new CompactUtil.EmployeeSerializer(),
                        new CompactUtil.EmployeeDTOSerializer(),
                        new CompactReturningAggregatorSerializer(),
                        new CompactPredicateSerializer(),
                        new InnerCompactSerializer(),
                        new OuterCompactSerializer(),
                        new CompactReturningEntryProcessorSerializer()
                    ]
                }
            },
            nearCaches: {
                ['nearCached1' + name]: {
                    invalidateOnChange: false,
                    maxIdleSeconds: 2,
                    inMemoryFormat: 'OBJECT',
                    timeToLiveSeconds: 3,
                    evictionPolicy: 'lru',
                    evictionMaxSize: 3000,
                    evictionSamplingCount: 4,
                    evictionSamplingPoolSize: 8
                },
                ['nearCached2' + name]: {
                    invalidateOnChange: false,
                    maxIdleSeconds: 2,
                    inMemoryFormat: 'BINARY',
                    timeToLiveSeconds: 3,
                    evictionPolicy: 'lru',
                    evictionMaxSize: 3000,
                    evictionSamplingCount: 4,
                    evictionSamplingPoolSize: 8
                }
            }
        };

        client = await testFactory.newHazelcastClientForParallelTests(clientConfig, member);
        map = await client.getMap(name);
        nearCachedMap1 = await client.getMap('nearCached1' + name);
        nearCachedMap2 = await client.getMap('nearCached2' + name);
        multimap = await client.getMultiMap(name);
        replicatedMap = await client.getReplicatedMap(name);
        list = await client.getList(name);
        atomicReference = await client.getCPSubsystem().getAtomicReference(name);
        queue = await client.getQueue(name);
        set = await client.getSet(name);
        topic = await client.getReliableTopic(name);
        ringBuffer = await client.getRingbuffer(name);
        compactSerializerUsed = false;
    });

    afterEach(async function () {
        if (!skipped) {
            compactSerializerUsed.should.be.true;
        }
        sandbox.restore();
        await map.destroy();
        await nearCachedMap1.destroy();
        await nearCachedMap2.destroy();
        await multimap.destroy();
        await replicatedMap.destroy();
        await list.destroy();
        await atomicReference.destroy();
        await queue.destroy();
        await set.destroy();
        await topic.destroy();
        await ringBuffer.destroy();
        await testFactory.shutdownAllClients();
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    const putToMapFromOtherClient = async (mapName, key, value) => {
        const client = await testFactory.newHazelcastClientForParallelTests(clientConfig, member);
        const map = await client.getMap(mapName);
        await map.put(key, value);
    };

    const putToReplicatedMapFromOtherClient = async (replicatedMapName, key, value) => {
        const client = await testFactory.newHazelcastClientForParallelTests(clientConfig, member);
        const replicatedMap = await client.getReplicatedMap(replicatedMapName);
        await replicatedMap.put(key, value);
    };

    const assertEntryEvent = async (events) => {
        await TestUtil.assertTrueEventually(async () => {
            events.length.should.be.equal(1);
            const event = events[0];
            event.key.should.be.deep.equal(INNER_INSTANCE);
            event.value.should.be.deep.equal(OUTER_INSTANCE);
            should.equal(event.oldValue, null);
            should.equal(event.mergingValue, null);
        });
    };

    /**
     * Tests that proxy method should throw the same error toData throws if the error is not an instance of
     * SchemaNotReplicatedError. This test is necessary for a good coverage.
     *
     * @param client Client instance
     * @param proxyMethod Proxy method bound `this` value and its parameters
     */
    const shouldThrowSerializationErrors = (client, proxyMethod) => {
        const err = new Error('Mock Serialization Error');
        sandbox.replace(client.getSerializationService(), 'toData', sandbox.fake.throws(err));
        const thrownErr = TestUtil.getThrownErrorOrThrow(() => {
            proxyMethod();
        });
        thrownErr.should.be.equal(err);
        sandbox.restore();
    };

    describe('Map/NearCaches', function () {
        it('aggregate', async function() {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.aggregate.bind(obj, new CompactReturningAggregator());
                const result = await fn();
                result.should.be.deep.eq(OUTER_INSTANCE);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('aggregateWithPredicate', async function() {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.aggregateWithPredicate.bind(obj, new CompactReturningAggregator(), new CompactPredicate());
                const result = await fn();
                result.should.be.deep.eq(OUTER_INSTANCE);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('containsKey', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.containsKey.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('containsValue', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.containsValue.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('put', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.put.bind(obj, OUTER_INSTANCE, employee);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('putAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.putAll.bind(obj, [[OUTER_INSTANCE, OUTER_INSTANCE], [employee, employee]]);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('setAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.setAll.bind(obj, [[OUTER_INSTANCE, OUTER_INSTANCE], [employee, employee]]);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('get', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.get.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('getAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.getAll.bind(obj, [OUTER_INSTANCE, employee]);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('remove', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.remove.bind(obj, OUTER_INSTANCE, employee);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('removeAll', async function () {
            if (!TestUtil.isClientVersionAtLeast('5.2.0')) {
                skipped = true;
                this.skip();
            }
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.removeAll.bind(obj, new CompactPredicate());
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('delete', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.delete.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('evict', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.evict.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('forceUnlock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.forceUnlock.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('isLocked', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.isLocked.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('loadAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.loadAll.bind(obj, [OUTER_INSTANCE, employee]);
                const error = await TestUtil.getRejectionReasonOrThrow(
                    async () => await fn()
                );
                // MapStore configuration is needed for this to work, it throws NullPointerError.
                // So we assert it does not throw SchemaNotReplicatedError
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('putIfAbsent', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.putIfAbsent.bind(obj, OUTER_INSTANCE, employee);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('putTransient', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.putTransient.bind(obj, OUTER_INSTANCE, employee);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('replaceIfSame', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.replaceIfSame.bind(obj, OUTER_INSTANCE, employee, OUTER_INSTANCE2);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('replace', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.replace.bind(obj, OUTER_INSTANCE, employee);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('set', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.set.bind(obj, OUTER_INSTANCE, employee);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('lock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.lock.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('unlock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.unlock.bind(obj, OUTER_INSTANCE);
                const error = await TestUtil.getRejectionReasonOrThrow(async () => await fn());
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('getEntryView', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.getEntryView.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('tryLock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.tryLock.bind(obj, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('tryPut', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.tryPut.bind(obj, OUTER_INSTANCE, employee, 0);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('tryRemove', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.tryRemove.bind(obj, OUTER_INSTANCE, 0);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('addEntryListener', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.addEntryListener.bind(obj, {}, OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('addEntryListenerWithPredicate (key argument serialization)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.addEntryListenerWithPredicate.bind(obj, {}, Predicates.alwaysTrue(), OUTER_INSTANCE);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('addEntryListenerWithPredicate (compact predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.addEntryListenerWithPredicate.bind(obj, {
                    added: event => {
                        events.push(event);
                    },
                }, new CompactPredicate(), INNER_INSTANCE, true);
                const events = [];
                await fn();
                await putToMapFromOtherClient(obj.getName(), INNER_INSTANCE, OUTER_INSTANCE);
                await assertEntryEvent(events);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('executeOnEntries', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await putToMapFromOtherClient(obj.getName(), OUTER_INSTANCE, INNER_INSTANCE);
                const fn = obj.executeOnEntries.bind(obj, new CompactReturningEntryProcessor());
                const results = await fn();
                results.should.be.deep.equal([[OUTER_INSTANCE, OUTER_INSTANCE]]);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('executeOnEntries (with predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await putToMapFromOtherClient(obj.getName(), OUTER_INSTANCE, INNER_INSTANCE);
                const fn = obj.executeOnEntries.bind(obj, new CompactReturningEntryProcessor(), new CompactPredicate());
                const results = await fn();
                results.should.be.deep.equal([[OUTER_INSTANCE, OUTER_INSTANCE]]);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('executeOnKey', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await putToMapFromOtherClient(obj.getName(), OUTER_INSTANCE, INNER_INSTANCE);
                const fn = obj.executeOnKey.bind(obj, OUTER_INSTANCE, new CompactReturningEntryProcessor());
                const results = await fn();
                results.should.be.deep.equal(OUTER_INSTANCE);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('executeOnKeys', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await putToMapFromOtherClient(obj.getName(), OUTER_INSTANCE, INNER_INSTANCE);
                const fn = obj.executeOnKeys.bind(obj, [OUTER_INSTANCE], new CompactReturningEntryProcessor());
                const results = await fn();
                results.should.be.deep.equal([[OUTER_INSTANCE, OUTER_INSTANCE]]);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('setTtl', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const fn = obj.setTtl.bind(obj, OUTER_INSTANCE, 1000);
                await fn();
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('entrySetWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const fn = obj.entrySetWithPredicate.bind(obj, new CompactPredicate());
                const result = await fn();
                result.should.be.deep.equal([[INNER_INSTANCE, OUTER_INSTANCE]]);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('entrySetWithPredicate (paging predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const fn = obj.entrySetWithPredicate.bind(obj, pagingPredicate);
                const result = await fn();
                result.should.be.deep.equal([[INNER_INSTANCE, OUTER_INSTANCE]]);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('keySetWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const fn = obj.keySetWithPredicate.bind(obj, new CompactPredicate());
                const result = await fn();
                result.should.be.deep.equal([INNER_INSTANCE]);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('keySetWithPredicate (paging predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const fn = obj.keySetWithPredicate.bind(obj, pagingPredicate);
                const result = await fn();
                result.should.be.deep.equal([INNER_INSTANCE]);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('valuesWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const fn = obj.valuesWithPredicate.bind(obj, new CompactPredicate());
                const result = await fn();
                result.get(0).should.be.deep.equal(OUTER_INSTANCE);
                shouldThrowSerializationErrors(client, fn);
            }
        });

        it('valuesWithPredicate (paging predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const fn = obj.valuesWithPredicate.bind(obj, pagingPredicate);
                const result = await fn();
                result.get(0).should.be.deep.equal(OUTER_INSTANCE);
                shouldThrowSerializationErrors(client, fn);
            }
        });
    });

    describe('MultiMap', function () {
        it('put', async function () {
            const fn = multimap.put.bind(multimap, OUTER_INSTANCE, employee);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('get', async function () {
            const fn = multimap.get.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('remove', async function () {
            const fn = multimap.remove.bind(multimap, OUTER_INSTANCE, employee);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('removeAll', async function () {
            const fn = multimap.removeAll.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('containsKey', async function () {
            const fn = multimap.containsKey.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('containsValue', async function () {
            const fn = multimap.containsValue.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('containsEntry', async function () {
            const fn = multimap.containsEntry.bind(multimap, OUTER_INSTANCE, employee);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('valueCount', async function () {
            const fn = multimap.valueCount.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addEntryListener', async function () {
            const fn = multimap.addEntryListener.bind(multimap, {}, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('isLocked', async function () {
            const fn = multimap.isLocked.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('tryLock', async function () {
            const fn = multimap.tryLock.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('lock', async function () {
            const fn = multimap.lock.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('unlock', async function () {
            const fn = multimap.unlock.bind(multimap, OUTER_INSTANCE);
            const error = await TestUtil.getRejectionReasonOrThrow(async () => await fn());
            error.should.not.be.instanceOf(SchemaNotReplicatedError);
            shouldThrowSerializationErrors(client, fn);
        });

        it('forceUnlock', async function () {
            const fn = multimap.forceUnlock.bind(multimap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('putAll', async function () {
            const fn = multimap.putAll.bind(
                multimap, [[OUTER_INSTANCE, [employee]], [employee, [OUTER_INSTANCE2]], [OUTER_INSTANCE, [OUTER_INSTANCE2]]]
            );
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });
    });

    describe('ReplicatedMap', function () {
        it('put', async function () {
            const fn = replicatedMap.put.bind(replicatedMap, OUTER_INSTANCE, employee);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('get', async function () {
            const fn = replicatedMap.get.bind(replicatedMap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('containsKey', async function () {
            const fn = replicatedMap.containsKey.bind(replicatedMap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('containsValue', async function () {
            const fn = replicatedMap.containsValue.bind(replicatedMap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('remove', async function () {
            const fn = replicatedMap.remove.bind(replicatedMap, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('putAll', async function () {
            const fn = replicatedMap.putAll.bind(replicatedMap, [[OUTER_INSTANCE, employee], [employee, OUTER_INSTANCE2]]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addEntryListenerToKeyWithPredicate (key argument serialization)', async function () {
            const fn = replicatedMap.addEntryListenerToKeyWithPredicate.bind(
                replicatedMap, {}, OUTER_INSTANCE, Predicates.alwaysTrue()
            );
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addEntryListenerToKeyWithPredicate (compact predicate)', async function () {
            const events = [];
            const fn = replicatedMap.addEntryListenerToKeyWithPredicate.bind(replicatedMap, {
                added: event => {
                    events.push(event);
                },
            }, INNER_INSTANCE, new CompactPredicate());
            await fn();
            await putToReplicatedMapFromOtherClient(replicatedMap.getName(), INNER_INSTANCE, OUTER_INSTANCE);
            await assertEntryEvent(events);
            shouldThrowSerializationErrors(client, fn);
        });

        it('addEntryListenerToKey', async function () {
            const fn = replicatedMap.addEntryListenerToKey.bind(replicatedMap, {}, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });
    });

    describe('List', function () {
        it('add', async function () {
            const fn = list.add.bind(list, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addAt', async function () {
            const fn = list.addAt.bind(list, 0, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addAll', async function () {
            const fn = list.addAll.bind(list, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addAllAt', async function () {
            const fn = list.addAllAt.bind(list, 0, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('contains', async function () {
            const fn = list.contains.bind(list, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('containsAll', async function () {
            const fn = list.containsAll.bind(list, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('indexOf', async function () {
            const fn = list.indexOf.bind(list, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('lastIndexOf', async function () {
            const fn = list.lastIndexOf.bind(list, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('remove', async function () {
            const fn = list.remove.bind(list, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('removeAll', async function () {
            const fn = list.removeAll.bind(list, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('retainAll', async function () {
            const fn = list.retainAll.bind(list, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('set', async function () {
            await list.add(OUTER_INSTANCE);
            // Clear schema retrieved via add()
            client.schemaService.schemas.clear();
            const fn = list.set.bind(list, 0, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });
    });

    describe('AtomicReference', function () {
        it('compareAndSet', async function () {
            const fn = atomicReference.compareAndSet.bind(atomicReference, OUTER_INSTANCE, employee);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('set', async function () {
            const fn = atomicReference.set.bind(atomicReference, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('getAndSet', async function () {
            const fn = atomicReference.getAndSet.bind(atomicReference, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('contains', async function () {
            const fn = atomicReference.contains.bind(atomicReference, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });
    });

    describe('Queue', function () {
        it('add', async function () {
            const fn = queue.add.bind(queue, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addAll', async function () {
            const fn = queue.addAll.bind(queue, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('contains', async function () {
            const fn = queue.contains.bind(queue, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('containsAll', async function () {
            const fn = queue.containsAll.bind(queue, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('offer', async function () {
            const fn = queue.offer.bind(queue, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('put', async function () {
            const fn = queue.put.bind(queue, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('remove', async function () {
            const fn = queue.remove.bind(queue, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('removeAll', async function () {
            const fn = queue.removeAll.bind(queue, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('retainAll', async function () {
            const fn = queue.retainAll.bind(queue, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });
    });

    describe('Set', function () {
        it('add', async function () {
            const fn = set.add.bind(set, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addAll', async function () {
            const fn = set.addAll.bind(set, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('contains', async function () {
            const fn = set.contains.bind(set, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('containsAll', async function () {
            const fn = set.containsAll.bind(set, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('remove', async function () {
            const fn = set.remove.bind(set, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('removeAll', async function () {
            const fn = set.removeAll.bind(set, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('retainAll', async function () {
            const fn = set.retainAll.bind(set, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });
    });

    describe('ReliableTopic', function () {
        it('publish', async function () {
            const fn = topic.publish.bind(topic, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });
    });

    describe('RingBuffer', function () {
        it('add', async function () {
            const fn = ringBuffer.add.bind(ringBuffer, OUTER_INSTANCE);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });

        it('addAll', async function () {
            const fn = ringBuffer.addAll.bind(ringBuffer, [OUTER_INSTANCE, employee]);
            await fn();
            shouldThrowSerializationErrors(client, fn);
        });
    });
});
