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
chai.should();

const RC = require('../../RC');
const TestUtil = require('../../../TestUtil');
const { Predicates } = require('../../../../lib');

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

/**
 * Tests all APIs if they can serialize compact objects.
 */
describe('CompactAPISerializationTest', function () {
    let cluster;
    let member;
    let client;
    let map, multimap, list, atomicReference,
        queue, set, topic, nearCachedMap1, nearCachedMap2,
        replicatedMap, ringBuffer;
    let employee;
    let SchemaNotReplicatedError;
    let CompactStreamSerializer;
    let CompactUtil;

    const COMPACT_ENABLED_ZERO_CONFIG_XML = `
        <hazelcast xmlns="http://www.hazelcast.com/schema/config"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.hazelcast.com/schema/config
            http://www.hazelcast.com/schema/config/hazelcast-config-5.0.xsd">
            <network>
                <port>0</port>
            </network>
            <serialization>
                <compact-serialization enabled="true" />
            </serialization>
        </hazelcast>
    `;

    const car1 = new Car('ww', 123456);
    const car2 = new Car('porsche', 21231);
    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        CompactUtil = require('../parallel/serialization/compact/CompactUtil');
        employee = new CompactUtil.Employee(1, Long.ONE);
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        cluster = await testFactory.createClusterForParallelTests(null, COMPACT_ENABLED_ZERO_CONFIG_XML);
        member = await RC.startMember(cluster.id);
        SchemaNotReplicatedError = require('../../../../lib').SchemaNotReplicatedError;
        CompactStreamSerializer = require('../../../../lib/serialization/compact/CompactStreamSerializer')
            .CompactStreamSerializer;
    });

    beforeEach(async function () {
        const name = TestUtil.randomString(12);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [
                    new CarSerializer(),
                    new CompactUtil.EmployeeSerializer(),
                    new CompactUtil.EmployeeDTOSerializer(),
                    new DummyEntryProcessorSerializer()
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
        }, member);
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

    describe('Map/NearCaches', function () {
        it('containsKey', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.containsKey(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('containsValue', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.containsValue(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('put', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.put(car1, employee);
                compactSerializerUsed.should.be.true;
            }
        });

        it('putAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.putAll([[car1, car1], [employee, employee]]);
                compactSerializerUsed.should.be.true;
            }
        });

        it('setAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.setAll([[car1, car1], [employee, employee]]);
                compactSerializerUsed.should.be.true;
            }
        });

        it('get', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.get(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('getAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.getAll([car1, employee]);
                compactSerializerUsed.should.be.true;
            }
        });

        it('remove', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.remove(car1, employee);
                compactSerializerUsed.should.be.true;
            }
        });

        it('delete', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.delete(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('evict', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.evict(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('forceUnlock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.forceUnlock(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('isLocked', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.isLocked(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('loadAll', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                const error = await TestUtil.getRejectionReasonOrThrow(
                    async () => await obj.loadAll([car1, employee])
                );
                // MapStore configuration is needed for this to work, it throws NullPointerError.
                // So we assert it does not throw SchemaNotReplicatedError
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
                compactSerializerUsed.should.be.true;
            }
        });

        it('putIfAbsent', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.putIfAbsent(car1, employee);
                compactSerializerUsed.should.be.true;
            }
        });

        it('putTransient', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.putTransient(car1, employee);
                compactSerializerUsed.should.be.true;
            }
        });

        it('replaceIfSame', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.replaceIfSame(car1, employee, car2);
                compactSerializerUsed.should.be.true;
            }
        });

        it('replace', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.replace(car1, employee);
                compactSerializerUsed.should.be.true;
            }
        });

        it('set', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.set(car1, employee);
                compactSerializerUsed.should.be.true;
            }
        });

        it('lock/unlock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.lock(car1);
                // Clear schema retrieved via lock()
                client.schemaService.schemas.clear();
                await obj.unlock(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('getEntryView', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.getEntryView(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('tryLock', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.tryLock(car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('tryPut', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.tryPut(car1, employee, 0);
                compactSerializerUsed.should.be.true;
            }
        });

        it('tryRemove', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.tryRemove(car1, 0);
                compactSerializerUsed.should.be.true;
            }
        });

        it('addEntryListener', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.addEntryListener(() => { }, car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('addEntryListenerWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.addEntryListenerWithPredicate(() => { }, Predicates.sql('price > 1'), car1);
                compactSerializerUsed.should.be.true;
            }
        });

        it('executeOnKey', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                const error = await TestUtil.getRejectionReasonOrThrow(
                    async () => await obj.executeOnKey(car1, new DummyEntryProcessor())
                );
                // This call will throw since it won't be able to cast to EntryProcessor.
                // So we assert it does not throw SchemaNotReplicatedError
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
                compactSerializerUsed.should.be.true;
            }
        });

        it('executeOnEntries', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                const error = await TestUtil.getRejectionReasonOrThrow(
                    async () => await obj.executeOnEntries(new DummyEntryProcessor(), Predicates.sql('price > 1'))
                );
                // This call will throw since it won't be able to cast to EntryProcessor.
                // So we assert it does not throw SchemaNotReplicatedError
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
                compactSerializerUsed.should.be.true;
            }
        });

        it('executeOnKeys', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                const error = await TestUtil.getRejectionReasonOrThrow(
                    async () => await obj.executeOnKeys([car1, employee], new DummyEntryProcessor())
                );
                // This call will throw since it won't be able to cast to EntryProcessor.
                // So we assert it does not throw SchemaNotReplicatedError
                error.should.not.be.instanceOf(SchemaNotReplicatedError);
                compactSerializerUsed.should.be.true;
            }
        });

        it('setTtl', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                compactSerializerUsed = false;
                await obj.setTtl(car1, 1000);
                compactSerializerUsed.should.be.true;
            }
        });

        it('entrySetWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                // Since we use EmployeeDTOSerializer here we won't assert compactSerializerUsed here
                // Instead we will spy CompactStreamSerializer.write
                const compactWriteSpy = sandbox.replace(
                    CompactStreamSerializer.prototype, 'write', sandbox.fake(CompactStreamSerializer.prototype.write)
                );
                const pagingPredicate = Predicates.paging(Predicates.alwaysTrue(), 1);
                await obj.set(new CompactUtil.EmployeeDTO(1, Long.fromNumber(1)),
                    new CompactUtil.EmployeeDTO(1, Long.fromNumber(1)));
                await obj.set(new CompactUtil.EmployeeDTO(2, Long.fromNumber(2)),
                    new CompactUtil.EmployeeDTO(2, Long.fromNumber(2)));
                await obj.set(new CompactUtil.EmployeeDTO(3, Long.fromNumber(3)),
                    new CompactUtil.EmployeeDTO(3, Long.fromNumber(3)));
                // Clear schema retrieved via set()
                client.schemaService.schemas.clear();
                await obj.entrySetWithPredicate(pagingPredicate);
                pagingPredicate.nextPage();
                await obj.entrySetWithPredicate(pagingPredicate);
                pagingPredicate.nextPage();
                await obj.entrySetWithPredicate(pagingPredicate);
                compactWriteSpy.called.should.be.true;
                sandbox.restore();
            }
            // little trick to make the test pass
            compactSerializerUsed = true;
        });

        it('keySetWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const pagingPredicate = Predicates.paging(Predicates.alwaysTrue(), 1);
                compactSerializerUsed = false;
                await obj.set(1, new Car('1', 1));
                await obj.set(2, new Car('2', 2));
                await obj.set(3, new Car('3', 3));
                // Clear schema retrieved via set()
                client.schemaService.schemas.clear();
                await obj.keySetWithPredicate(pagingPredicate);
                pagingPredicate.nextPage();
                await obj.keySetWithPredicate(pagingPredicate);
                pagingPredicate.nextPage();
                await obj.keySetWithPredicate(pagingPredicate);
                compactSerializerUsed.should.be.true;
            }
        });

        it('valuesWithPredicate', async function () {
            for (const obj of [map, nearCachedMap1, nearCachedMap2]) {
                const pagingPredicate = Predicates.paging(Predicates.alwaysTrue(), 1);
                compactSerializerUsed = false;
                await obj.set(new Car('1', 1), 1);
                await obj.set(new Car('2', 2), 2);
                await obj.set(new Car('3', 3), 3);
                // Clear schema retrieved via set()
                client.schemaService.schemas.clear();
                await obj.valuesWithPredicate(pagingPredicate);
                pagingPredicate.nextPage();
                await obj.valuesWithPredicate(pagingPredicate);
                pagingPredicate.nextPage();
                await obj.valuesWithPredicate(pagingPredicate);
                compactSerializerUsed.should.be.true;
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
            await multimap.addEntryListener(() => { }, car1);
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

        it('addEntryListenerToKeyWithPredicate', async function () {
            await replicatedMap.addEntryListenerToKeyWithPredicate(() => {}, car1, Predicates.alwaysTrue());
        });

        it('addEntryListenerToKey', async function () {
            await replicatedMap.addEntryListenerToKey(() => {}, car1);
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
