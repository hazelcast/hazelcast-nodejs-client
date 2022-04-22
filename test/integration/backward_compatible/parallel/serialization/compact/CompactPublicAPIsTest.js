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
 * Tests all Public APIs if they can serialize compact objects.
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

    const CLUSTER_CONFIG_XML = `
        <hazelcast xmlns="http://www.hazelcast.com/schema/config"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.hazelcast.com/schema/config
            http://www.hazelcast.com/schema/config/hazelcast-config-5.0.xsd">
            <network>
                <port>0</port>
            </network>
            <serialization>
                <compact-serialization enabled="true"/>
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
        cluster = await testFactory.createClusterForParallelTests(null, CLUSTER_CONFIG_XML);
        member = await RC.startMember(cluster.id);
        SchemaNotReplicatedError = require('../../../../../../lib').SchemaNotReplicatedError;
    });

    beforeEach(async function () {
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
        TestUtil.markServerVersionAtLeast(this, client, '5.1.0');
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
        compactSerializerUsed.should.be.true;
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

    describe('Map/NearCaches', function () {
        it('aggregate', async function() {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const result = await obj.aggregate(new CompactReturningAggregator());
                result.should.be.deep.eq(OUTER_INSTANCE);
            }
        });

        it('aggregateWithPredicate', async function() {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const result = await obj.aggregateWithPredicate(new CompactReturningAggregator(), new CompactPredicate());
                result.should.be.deep.eq(OUTER_INSTANCE);
            }
        });

        it('containsKey', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.containsKey(OUTER_INSTANCE);
            }
        });

        it('containsValue', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.containsValue(OUTER_INSTANCE);
            }
        });

        it('put', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.put(OUTER_INSTANCE, employee);
            }
        });

        it('putAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.putAll([[OUTER_INSTANCE, OUTER_INSTANCE], [employee, employee]]);
            }
        });

        it('setAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.setAll([[OUTER_INSTANCE, OUTER_INSTANCE], [employee, employee]]);
            }
        });

        it('get', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.get(OUTER_INSTANCE);
            }
        });

        it('getAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.getAll([OUTER_INSTANCE, employee]);
            }
        });

        it('remove', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.remove(OUTER_INSTANCE, employee);
            }
        });

        it('delete', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.delete(OUTER_INSTANCE);
            }
        });

        it('evict', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.evict(OUTER_INSTANCE);
            }
        });

        it('forceUnlock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.forceUnlock(OUTER_INSTANCE);
            }
        });

        it('isLocked', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.isLocked(OUTER_INSTANCE);
            }
        });

        it('loadAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const error = await TestUtil.getRejectionReasonOrThrow(
                    async () => await obj.loadAll([OUTER_INSTANCE, employee])
                );
                // MapStore configuration is needed for this to work, it throws NullPointerError.
                // So we assert it does not throw SchemaNotReplicatedError
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
            }
        });

        it('putIfAbsent', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.putIfAbsent(OUTER_INSTANCE, employee);
            }
        });

        it('putTransient', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.putTransient(OUTER_INSTANCE, employee);
            }
        });

        it('replaceIfSame', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.replaceIfSame(OUTER_INSTANCE, employee, OUTER_INSTANCE2);
            }
        });

        it('replace', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.replace(OUTER_INSTANCE, employee);
            }
        });

        it('set', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(OUTER_INSTANCE, employee);
            }
        });

        it('lock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.lock(OUTER_INSTANCE);
            }
        });

        it('unlock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const error = await TestUtil.getRejectionReasonOrThrow(async () => await obj.unlock(OUTER_INSTANCE));
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
            }
        });

        it('getEntryView', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.getEntryView(OUTER_INSTANCE);
            }
        });

        it('tryLock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.tryLock(OUTER_INSTANCE);
            }
        });

        it('tryPut', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.tryPut(OUTER_INSTANCE, employee, 0);
            }
        });

        it('tryRemove', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.tryRemove(OUTER_INSTANCE, 0);
            }
        });

        it('addEntryListener', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.addEntryListener({}, OUTER_INSTANCE);
            }
        });

        it('addEntryListenerWithPredicate (key argument serialization)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.addEntryListenerWithPredicate({}, Predicates.alwaysTrue(), OUTER_INSTANCE);
            }
        });

        it('addEntryListenerWithPredicate (compact predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const events = [];
                await obj.addEntryListenerWithPredicate({
                    added: event => {
                        events.push(event);
                    },
                }, new CompactPredicate(), INNER_INSTANCE, true);
                await putToMapFromOtherClient(obj.getName(), INNER_INSTANCE, OUTER_INSTANCE);
                await assertEntryEvent(events);
            }
        });

        it('executeOnEntries', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await putToMapFromOtherClient(obj.getName(), OUTER_INSTANCE, INNER_INSTANCE);
                const results = await obj.executeOnEntries(new CompactReturningEntryProcessor());
                results.should.be.deep.equal([[OUTER_INSTANCE, OUTER_INSTANCE]]);
            }
        });

        it('executeOnEntries (with predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await putToMapFromOtherClient(obj.getName(), OUTER_INSTANCE, INNER_INSTANCE);
                const results = await obj.executeOnEntries(new CompactReturningEntryProcessor(), new CompactPredicate());
                results.should.be.deep.equal([[OUTER_INSTANCE, OUTER_INSTANCE]]);
            }
        });

        it('executeOnKey', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await putToMapFromOtherClient(obj.getName(), OUTER_INSTANCE, INNER_INSTANCE);
                const results = await obj.executeOnKey(OUTER_INSTANCE, new CompactReturningEntryProcessor());
                results.should.be.deep.equal(OUTER_INSTANCE);
            }
        });

        it('executeOnKeys', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await putToMapFromOtherClient(obj.getName(), OUTER_INSTANCE, INNER_INSTANCE);
                const results = await obj.executeOnKeys([OUTER_INSTANCE], new CompactReturningEntryProcessor());
                results.should.be.deep.equal([[OUTER_INSTANCE, OUTER_INSTANCE]]);
            }
        });

        it('setTtl', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.setTtl(OUTER_INSTANCE, 1000);
            }
        });

        it('entrySetWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const result = await obj.entrySetWithPredicate(new CompactPredicate());
                result.should.be.deep.equal([[INNER_INSTANCE, OUTER_INSTANCE]]);
            }
        });

        it('entrySetWithPredicate (paging predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const result = await obj.entrySetWithPredicate(pagingPredicate);
                result.should.be.deep.equal([[INNER_INSTANCE, OUTER_INSTANCE]]);
            }
        });

        it('keySetWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const result = await obj.keySetWithPredicate(new CompactPredicate());
                result.should.be.deep.equal([INNER_INSTANCE]);
            }
        });

        it('keySetWithPredicate (paging predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const result = await obj.keySetWithPredicate(pagingPredicate);
                result.should.be.deep.equal([INNER_INSTANCE]);
            }
        });

        it('valuesWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const result = await obj.valuesWithPredicate(new CompactPredicate());
                result.get(0).should.be.deep.equal(OUTER_INSTANCE);
            }
        });

        it('valuesWithPredicate (paging predicate)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(INNER_INSTANCE, OUTER_INSTANCE);
                const result = await obj.valuesWithPredicate(pagingPredicate);
                result.get(0).should.be.deep.equal(OUTER_INSTANCE);
            }
        });
    });

    describe('MultiMap', function () {
        it('put', async function () {
            await multimap.put(OUTER_INSTANCE, employee);
        });

        it('get', async function () {
            await multimap.get(OUTER_INSTANCE);
        });

        it('remove', async function () {
            await multimap.remove(OUTER_INSTANCE, employee);
        });

        it('removeAll', async function () {
            await multimap.removeAll(OUTER_INSTANCE);
        });

        it('containsKey', async function () {
            await multimap.containsKey(OUTER_INSTANCE);
        });

        it('containsValue', async function () {
            await multimap.containsValue(OUTER_INSTANCE);
        });

        it('containsEntry', async function () {
            await multimap.containsEntry(OUTER_INSTANCE, employee);
        });

        it('valueCount', async function () {
            await multimap.valueCount(OUTER_INSTANCE);
        });

        it('addEntryListener', async function () {
            await multimap.addEntryListener({}, OUTER_INSTANCE);
        });

        it('isLocked', async function () {
            await multimap.isLocked(OUTER_INSTANCE);
        });

        it('tryLock', async function () {
            await multimap.tryLock(OUTER_INSTANCE);
        });

        it('lock', async function () {
            await multimap.lock(OUTER_INSTANCE);
        });

        it('unlock', async function () {
            const error = await TestUtil.getRejectionReasonOrThrow(async () => await multimap.unlock(OUTER_INSTANCE));
            error.should.not.be.instanceOf(SchemaNotReplicatedError);
        });

        it('forceUnlock', async function () {
            await multimap.forceUnlock(OUTER_INSTANCE);
        });

        it('putAll', async function () {
            await multimap.putAll(
                [[OUTER_INSTANCE, [employee]], [employee, [OUTER_INSTANCE2]], [OUTER_INSTANCE, [OUTER_INSTANCE2]]]
            );
        });
    });

    describe('ReplicatedMap', function () {
        it('put', async function () {
            await replicatedMap.put(OUTER_INSTANCE, employee);
        });

        it('get', async function () {
            await replicatedMap.get(OUTER_INSTANCE);
        });

        it('containsKey', async function () {
            await replicatedMap.containsKey(OUTER_INSTANCE);
        });

        it('containsValue', async function () {
            await replicatedMap.containsValue(OUTER_INSTANCE);
        });

        it('remove', async function () {
            await replicatedMap.remove(OUTER_INSTANCE);
        });

        it('putAll', async function () {
            await replicatedMap.putAll([[OUTER_INSTANCE, employee], [employee, OUTER_INSTANCE2]]);
        });

        it('addEntryListenerToKeyWithPredicate (key argument serialization)', async function () {
            await replicatedMap.addEntryListenerToKeyWithPredicate({}, OUTER_INSTANCE, Predicates.alwaysTrue());
        });

        it('addEntryListenerToKeyWithPredicate (compact predicate)', async function () {
            const events = [];
            await replicatedMap.addEntryListenerToKeyWithPredicate({
                added: event => {
                    events.push(event);
                },
            }, INNER_INSTANCE, new CompactPredicate());
            await putToReplicatedMapFromOtherClient(replicatedMap.getName(), INNER_INSTANCE, OUTER_INSTANCE);
            await assertEntryEvent(events);
        });

        it('addEntryListenerToKey', async function () {
            await replicatedMap.addEntryListenerToKey({}, OUTER_INSTANCE);
        });
    });

    describe('List', function () {
        it('add', async function () {
            await list.add(OUTER_INSTANCE);
        });

        it('addAt', async function () {
            await list.addAt(0, OUTER_INSTANCE);
        });

        it('addAll', async function () {
            await list.addAll([OUTER_INSTANCE, employee]);
        });

        it('addAllAt', async function () {
            await list.addAllAt(0, [OUTER_INSTANCE, employee]);
        });

        it('contains', async function () {
            await list.contains(OUTER_INSTANCE);
        });

        it('containsAll', async function () {
            await list.containsAll([OUTER_INSTANCE, employee]);
        });

        it('indexOf', async function () {
            await list.indexOf(OUTER_INSTANCE);
        });

        it('lastIndexOf', async function () {
            await list.lastIndexOf(OUTER_INSTANCE);
        });

        it('remove', async function () {
            await list.remove(OUTER_INSTANCE);
        });

        it('removeAll', async function () {
            await list.removeAll([OUTER_INSTANCE, employee]);
        });

        it('retainAll', async function () {
            await list.retainAll([OUTER_INSTANCE, employee]);
        });

        it('set', async function () {
            await list.add(OUTER_INSTANCE);
            // Clear schema retrieved via add()
            client.schemaService.schemas.clear();
            await list.set(0, OUTER_INSTANCE);
        });
    });

    describe('AtomicReference', function () {
        it('compareAndSet', async function () {
            await atomicReference.compareAndSet(OUTER_INSTANCE, employee);
        });

        it('set', async function () {
            await atomicReference.set(OUTER_INSTANCE);
        });

        it('getAndSet', async function () {
            await atomicReference.getAndSet(OUTER_INSTANCE);
        });

        it('contains', async function () {
            await atomicReference.contains(OUTER_INSTANCE);
        });
    });

    describe('Queue', function () {
        it('add', async function () {
            await queue.add(OUTER_INSTANCE);
        });

        it('addAll', async function () {
            await queue.addAll([OUTER_INSTANCE, employee]);
        });

        it('contains', async function () {
            await queue.contains(OUTER_INSTANCE);
        });

        it('containsAll', async function () {
            await queue.containsAll([OUTER_INSTANCE, employee]);
        });

        it('offer', async function () {
            await queue.offer(OUTER_INSTANCE);
        });

        it('put', async function () {
            await queue.put(OUTER_INSTANCE);
        });

        it('remove', async function () {
            await queue.remove(OUTER_INSTANCE);
        });

        it('removeAll', async function () {
            await queue.removeAll([OUTER_INSTANCE, employee]);
        });

        it('retainAll', async function () {
            await queue.retainAll([OUTER_INSTANCE, employee]);
        });
    });

    describe('Set', function () {
        it('add', async function () {
            await set.add(OUTER_INSTANCE);
        });

        it('addAll', async function () {
            await set.addAll([OUTER_INSTANCE, employee]);
        });

        it('contains', async function () {
            await set.contains(OUTER_INSTANCE);
        });

        it('containsAll', async function () {
            await set.containsAll([OUTER_INSTANCE, employee]);
        });

        it('remove', async function () {
            await set.remove(OUTER_INSTANCE);
        });

        it('removeAll', async function () {
            await set.removeAll([OUTER_INSTANCE, employee]);
        });

        it('retainAll', async function () {
            await set.retainAll([OUTER_INSTANCE, employee]);
        });
    });

    describe('ReliableTopic', function () {
        it('publish', async function () {
            await topic.publish(OUTER_INSTANCE);
        });
    });

    describe('RingBuffer', function () {
        it('add', async function () {
            await ringBuffer.add(OUTER_INSTANCE);
        });

        it('addAll', async function () {
            await ringBuffer.addAll([OUTER_INSTANCE, employee]);
        });
    });
});
