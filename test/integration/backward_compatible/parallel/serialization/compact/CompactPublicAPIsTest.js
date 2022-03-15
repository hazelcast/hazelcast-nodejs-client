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
const Long = require('long');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
chai.use(require('chai-as-promised'));
const should = chai.should();

const RC = require('../../../../RC');
const TestUtil = require('../../../../../TestUtil');
const { Predicates } = require('../../../../../../lib');

class Car {
    constructor(name, price) {
        this.name = name;
        this.price = price;
    }
}

let compactSerializerUsed = false;

class CarSerializer {
    constructor() {
        this.hzClass = Car;
        this.hzTypeName = 'Car';
    }

    read(reader) {
        compactSerializerUsed = true;
        const name = reader.readString('name');
        const price = reader.readInt32('price');

        return new Car(name, price);
    }

    write(writer, instance) {
        compactSerializerUsed = true;
        writer.writeString('name', instance.name);
        writer.writeInt32('price', instance.price);
    }
}

class DummyEntryProcessor { }

class DummyEntryProcessorSerializer {
    constructor() {
        this.hzClass = DummyEntryProcessor;
        this.hzTypeName = 'DummyEntryProcessor';
    }

    read() {
        compactSerializerUsed = true;
        return new DummyEntryProcessor();
    }

    write() {
        compactSerializerUsed = true;
    }
}

const portableFactory = classId => {
    if (classId === 2) {
        return new DummyEntryProcessor();
    }
};

class CompactReturningAggregator {
}

class CompactReturningAggregatorSerializer {
    constructor() {
        this.hzClass = CompactReturningAggregator;
        this.hzTypeName = 'CompactReturningAggregator';
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
    constructor() {
        this.hzClass = CompactPredicate;
        this.hzTypeName = 'CompactPredicate';
    }

    read() {
        compactSerializerUsed = true;
        return new CompactPredicate();
    }

    write() {
        compactSerializerUsed = true;
    }
}

class Inner {
    constructor(stringField) {
        this.stringField = stringField;
    }
}

class InnerSerializer {
    constructor() {
        this.hzClass = Inner;
        this.hzTypeName = 'Inner';
    }

    read(reader) {
        compactSerializerUsed = true;
        const stringField = reader.readString('string_field');
        return new Inner(stringField);
    }

    write(writer, instance) {
        compactSerializerUsed = true;
        writer.writeString('string_field', instance.stringField);
    }
}

class Outer {
    constructor(intField, innerField) {
        this.intField = intField;
        this.innerField = innerField;
    }
}

class OuterSerializer {
    constructor() {
        this.hzClass = Outer;
        this.hzTypeName = 'Outer';
    }

    read(reader) {
        compactSerializerUsed = true;
        const intField = reader.readInt32('int_field');
        const innerField = reader.readCompact('inner_field');
        return new Outer(intField, innerField);
    }

    write(writer, instance) {
        compactSerializerUsed = true;
        writer.writeInt32('int_field', instance.intField);
        writer.writeCompact('inner_field', instance.innerField);
    }
}

class CompactPagingPredicate {
    constructor() {
        this.delecate = Predicates.paging(Predicates.alwaysTrue(), 1);
    }

    getComparator() {
        return null;
    }

    nextPage() {
        this.delecate.nextPage();
    }

    previousPage() {
        this.delecate.previousPage();
    }

    getPage() {
        this.delecate.getPage();
    }

    setPage(page) {
        this.delecate.setPage(page);
    }

    getPageSize() {
        this.delecate.getPageSize();
    }

    getAnchor() {
        return this.delecate.getAnchor();
    }
}

class CompactPagingPredicateSerializer {
    constructor() {
        this.hzClass = CompactPagingPredicate;
        this.hzTypeName = 'CompactPagingPredicate';
    }

    read() {
        compactSerializerUsed = true;
        return new CompactPagingPredicate();
    }

    write() {
        compactSerializerUsed = true;
    }
}

class CompactReturningEntryProcessor {
}

class CompactReturningEntryProcessorSerializer {
    constructor() {
        this.hzClass = CompactReturningEntryProcessor;
        this.hzTypeName = 'CompactReturningEntryProcessor';
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
 * Tests all Public APIs if they can support compact objects.
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
    let CompactUtil;
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
                <compact-serialization enabled="true">
                    <registered-classes>
                        <class type-name="${Inner.name}"
                            serializer="com.hazelcast.compact.InnerSerializer">
                            com.hazelcast.compact.Inner
                        </class>
                        <class type-name="${Outer.name}"
                            serializer="com.hazelcast.compact.OuterSerializer">
                            com.hazelcast.compact.Outer
                        </class>
                        <class type-name="${CompactPredicate.name}"
                            serializer="com.hazelcast.compact.CompactPredicateSerializer">
                            com.hazelcast.compact.CompactPredicate
                        </class>
                        <class type-name="${CompactReturningAggregator.name}"
                            serializer="com.hazelcast.compact.CompactReturningAggregatorSerializer">
                            com.hazelcast.compact.CompactReturningAggregator
                        </class>
                        <class type-name="${CompactPagingPredicate.name}"
                            serializer="com.hazelcast.compact.CompactPagingPredicateSerializer">
                            com.hazelcast.compact.CompactPagingPredicate
                        </class>
                        <class type-name="${CompactReturningEntryProcessor.name}"
                            serializer="com.hazelcast.compact.CompactReturningEntryProcessorSerializer">
                            com.hazelcast.compact.CompactReturningEntryProcessor
                        </class>
                    </registered-classes>
                </compact-serialization>
            </serialization>
        </hazelcast>
    `;

    const car1 = new Car('ww', 123456);
    const car2 = new Car('porsche', 21231);
    const INNER_INSTANCE = new Inner('42');
    const OUTER_INSTANCE = new Outer(42, INNER_INSTANCE);
    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        CompactUtil = require('./CompactUtil');
        employee = new CompactUtil.Employee(1, Long.ONE);
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        cluster = await testFactory.createClusterForParallelTests(null, CLUSTER_CONFIG_XML);
        member = await RC.startMember(cluster.id);
        SchemaNotReplicatedError = require('../../../../../../lib').SchemaNotReplicatedError;
    });

    beforeEach(async function () {
        const name = TestUtil.randomString(12);

        clientConfig = {
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [
                    new CarSerializer(),
                    new CompactUtil.EmployeeSerializer(),
                    new CompactUtil.EmployeeDTOSerializer(),
                    new DummyEntryProcessorSerializer(),
                    new CompactReturningAggregatorSerializer(),
                    new CompactPredicateSerializer(),
                    new InnerSerializer(),
                    new OuterSerializer(),
                    new CompactPagingPredicateSerializer(),
                    new CompactReturningEntryProcessorSerializer()
                ],
                portableFactories: {
                    1: portableFactory
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
                await obj.containsKey(car1);
            }
        });

        it('containsValue', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.containsValue(car1);
            }
        });

        it('put', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.put(car1, employee);
            }
        });

        it('putAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.putAll([[car1, car1], [employee, employee]]);
            }
        });

        it('setAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.setAll([[car1, car1], [employee, employee]]);
            }
        });

        it('get', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.get(car1);
            }
        });

        it('getAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.getAll([car1, employee]);
            }
        });

        it('remove', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.remove(car1, employee);
            }
        });

        it('delete', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.delete(car1);
            }
        });

        it('evict', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.evict(car1);
            }
        });

        it('forceUnlock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.forceUnlock(car1);
            }
        });

        it('isLocked', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.isLocked(car1);
            }
        });

        it('loadAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const error = await TestUtil.getRejectionReasonOrThrow(
                    async () => await obj.loadAll([car1, employee])
                );
                // MapStore configuration is needed for this to work, it throws NullPointerError.
                // So we assert it does not throw SchemaNotReplicatedError
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
            }
        });

        it('putIfAbsent', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.putIfAbsent(car1, employee);
            }
        });

        it('putTransient', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.putTransient(car1, employee);
            }
        });

        it('replaceIfSame', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.replaceIfSame(car1, employee, car2);
            }
        });

        it('replace', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.replace(car1, employee);
            }
        });

        it('set', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.set(car1, employee);
            }
        });

        it('lock/unlock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.lock(car1);
                // Clear schema retrieved via lock()
                client.schemaService.schemas.clear();
                await obj.unlock(car1);
            }
        });

        it('getEntryView', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.getEntryView(car1);
            }
        });

        it('tryLock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.tryLock(car1);
            }
        });

        it('tryPut', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.tryPut(car1, employee, 0);
            }
        });

        it('tryRemove', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.tryRemove(car1, 0);
            }
        });

        it('addEntryListener', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.addEntryListener({}, car1);
            }
        });

        it('addEntryListenerWithPredicate (key argument serialization)', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                await obj.addEntryListenerWithPredicate({}, Predicates.alwaysTrue(), car1);
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
                await obj.setTtl(car1, 1000);
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
                const result = await obj.entrySetWithPredicate(new CompactPagingPredicate());
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
                const result = await obj.keySetWithPredicate(new CompactPagingPredicate());
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
                const result = await obj.valuesWithPredicate(new CompactPagingPredicate());
                result.get(0).should.be.deep.equal(OUTER_INSTANCE);
            }
        });
    });

    describe('MultiMap', function () {
        it('put', async function () {
            await multimap.put(car1, employee);
        });

        it('get', async function () {
            await multimap.get(car1);
        });

        it('remove', async function () {
            await multimap.remove(car1, employee);
        });

        it('removeAll', async function () {
            await multimap.removeAll(car1);
        });

        it('containsKey', async function () {
            await multimap.containsKey(car1);
        });

        it('containsValue', async function () {
            await multimap.containsValue(car1);
        });

        it('containsEntry', async function () {
            await multimap.containsEntry(car1, employee);
        });

        it('valueCount', async function () {
            await multimap.valueCount(car1);
        });

        it('addEntryListener', async function () {
            await multimap.addEntryListener({}, car1);
        });

        it('isLocked', async function () {
            await multimap.isLocked(car1);
        });

        it('tryLock', async function () {
            await multimap.tryLock(car1);
        });

        it('lock/unlock', async function () {
            await multimap.lock(car1);
            // Clear schema retrieved via lock()
            client.schemaService.schemas.clear();
            await multimap.unlock(car1);
        });

        it('forceUnlock', async function () {
            await multimap.forceUnlock(car1);
        });

        it('putAll', async function () {
            await multimap.putAll([[car1, [employee]], [employee, [car2]], [car1, [car2]]]);
        });
    });

    describe('ReplicatedMap', function () {
        it('put', async function () {
            await replicatedMap.put(car1, employee);
        });

        it('get', async function () {
            await replicatedMap.get(car1);
        });

        it('containsKey', async function () {
            await replicatedMap.containsKey(car1);
        });

        it('containsValue', async function () {
            await replicatedMap.containsValue(car1);
        });

        it('remove', async function () {
            await replicatedMap.remove(car1);
        });

        it('putAll', async function () {
            await replicatedMap.putAll([[car1, employee], [employee, car2]]);
        });

        it('addEntryListenerToKeyWithPredicate (key argument serialization)', async function () {
            await replicatedMap.addEntryListenerToKeyWithPredicate({}, car1, Predicates.alwaysTrue());
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
            await replicatedMap.addEntryListenerToKey({}, car1);
        });
    });

    describe('List', function () {
        it('add', async function () {
            await list.add(car1);
        });

        it('addAt', async function () {
            await list.addAt(0, car1);
        });

        it('addAll', async function () {
            await list.addAll([car1, employee]);
        });

        it('addAllAt', async function () {
            await list.addAllAt(0, [car1, employee]);
        });

        it('contains', async function () {
            await list.contains(car1);
        });

        it('containsAll', async function () {
            await list.containsAll([car1, employee]);
        });

        it('indexOf', async function () {
            await list.indexOf(car1);
        });

        it('lastIndexOf', async function () {
            await list.lastIndexOf(car1);
        });

        it('remove', async function () {
            await list.remove(car1);
        });

        it('removeAll', async function () {
            await list.removeAll([car1, employee]);
        });

        it('retainAll', async function () {
            await list.retainAll([car1, employee]);
        });

        it('set', async function () {
            await list.add(car1);
            // Clear schema retrieved via add()
            client.schemaService.schemas.clear();
            await list.set(0, car1);
        });
    });

    describe('AtomicReference', function () {
        it('compareAndSet', async function () {
            await atomicReference.compareAndSet(car1, employee);
        });

        it('set', async function () {
            await atomicReference.set(car1);
        });

        it('getAndSet', async function () {
            await atomicReference.getAndSet(car1);
        });

        it('contains', async function () {
            await atomicReference.contains(car1);
        });
    });

    describe('Queue', function () {
        it('add', async function () {
            await queue.add(car1);
        });

        it('addAll', async function () {
            await queue.addAll([car1, employee]);
        });

        it('contains', async function () {
            await queue.contains(car1);
        });

        it('containsAll', async function () {
            await queue.containsAll([car1, employee]);
        });

        it('offer', async function () {
            await queue.offer(car1);
        });

        it('put', async function () {
            await queue.put(car1);
        });

        it('remove', async function () {
            await queue.remove(car1);
        });

        it('removeAll', async function () {
            await queue.removeAll([car1, employee]);
        });

        it('retainAll', async function () {
            await queue.retainAll([car1, employee]);
        });
    });

    describe('Set', function () {
        it('add', async function () {
            await set.add(car1);
        });

        it('addAll', async function () {
            await set.addAll([car1, employee]);
        });

        it('contains', async function () {
            await set.contains(car1);
        });

        it('containsAll', async function () {
            await set.containsAll([car1, employee]);
        });

        it('remove', async function () {
            await set.remove(car1);
        });

        it('removeAll', async function () {
            await set.removeAll([car1, employee]);
        });

        it('retainAll', async function () {
            await set.retainAll([car1, employee]);
        });
    });

    describe('ReliableTopic', function () {
        it('publish', async function () {
            await topic.publish(car1);
        });
    });

    describe('RingBuffer', function () {
        it('add', async function () {
            await ringBuffer.add(car1);
        });

        it('addAll', async function () {
            await ringBuffer.addAll([car1, employee]);
        });
    });
});
