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

let carSerializerUsed = false;

class CarSerializer {
    constructor() {
        this.hzClass = Car;
        this.hzTypeName = 'Car';
    }

    read(reader) {
        carSerializerUsed = true;
        const name = reader.readString('name');
        const price = reader.readInt32('price');

        return new Car(name, price);
    }

    write(writer, instance) {
        carSerializerUsed = true;
        writer.writeString('name', instance.name);
        writer.writeInt32('price', instance.price);
    }
}

class DummyEntryProcessor {
    constructor() {
        this.factoryId = 1;
        this.classId = 2;
    }

    readPortable() {
    }

    writePortable() {
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

    const car1 = new Car('ww', 123456);
    const car2 = new Car('audi', 123457);
    const car3 = new Car('porsche', 21231);
    const testFactory = new TestUtil.TestFactory();

    before(async function() {
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        cluster = await testFactory.createClusterForParallelTests();
        member = await RC.startMember(cluster.id);
    });

    beforeEach(async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new CarSerializer()],
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
        const name = TestUtil.randomString(12);
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
        carSerializerUsed = false;
    });

    afterEach(async function () {
        carSerializerUsed.should.be.true;
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    [nearCachedMap1, nearCachedMap2, map].forEach(obj => {
        describe('Map/NearCache', function() {
            it('containsKey', async function() {
                await obj.containsKey(car1);
            });

            it('containsValue', async function() {
                await obj.containsValue(car1);
            });

            it('put', async function() {
                await obj.put(car1, car2);
            });

            it('putAll', async function() {
                await obj.putAll([[car1, car1], [car2, car2]]);
            });

            it('setAll', async function() {
                await obj.setAll([[car1, car1], [car2, car2]]);
            });

            it('get', async function() {
                await obj.get(car1);
            });

            it('getAll', async function() {
                await obj.getAll([car1, car2]);
            });

            it('remove', async function() {
                await obj.remove(car1, car2);
            });

            it('delete', async function() {
                await obj.delete(car1);
            });

            it('evict', async function() {
                await obj.evict(car1);
            });

            it('forceUnlock', async function() {
                await obj.forceUnlock(car1);
            });

            it('isLocked', async function() {
                await obj.isLocked(car1);
            });

            it('loadAll', async function() {
                await obj.loadAll([car1, car2]);
            });

            it('putIfAbsent', async function() {
                await obj.putIfAbsent(car1, car2);
            });

            it('putTransient', async function() {
                await obj.putTransient(car1, car2);
            });

            it('replaceIfSame', async function() {
                await obj.replaceIfSame(car1, car2, car3);
            });

            it('replace', async function() {
                await obj.replace(car1, car2);
            });

            it('set', async function() {
                await obj.set(car1, car2);
            });

            it('unlock', async function() {
                await obj.unlock(car1);
            });

            it('getEntryView', async function() {
                await obj.getEntryView(car1);
            });

            it('tryLock', async function() {
                await obj.tryLock(car1);
            });

            it('tryPut', async function() {
                await obj.tryPut(car1, car2);
            });

            it('tryRemove', async function() {
                await obj.tryRemove(car1);
            });

            it('addEntryListener', async function() {
                await obj.addEntryListener(() => {}, car1);
            });

            it('addEntryListenerWithPredicate', async function() {
                await obj.addEntryListenerWithPredicate(() => {}, Predicates.sql('price > 1'), car1);
            });

            it('executeOnKey', async function() {
                await obj.executeOnKey(car1, new DummyEntryProcessor());
            });

            it('executeOnKeys', async function() {
                await obj.executeOnKeys([car1, car2], new DummyEntryProcessor());
            });

            it('setTtl', async function() {
                await obj.setTtl(car1, 1000);
            });
        });
    });

    describe('MultiMap', function() {
        it('put', async function() {
            await multimap.put(car1, car2);
        });

        it('get', async function() {
            await multimap.get(car1);
        });

        it('remove', async function() {
            await multimap.remove(car1, car2);
        });

        it('removeAll', async function() {
            await multimap.removeAll(car1);
        });

        it('containsKey', async function() {
            await multimap.containsKey(car1);
        });

        it('containsValue', async function() {
            await multimap.containsValue(car1);
        });

        it('containsEntry', async function() {
            await multimap.containsEntry(car1, car2);
        });

        it('valueCount', async function() {
            await multimap.valueCount(car1);
        });

        it('addEntryListener', async function() {
            await multimap.addEntryListener(() => {}, car1);
        });

        it('lock', async function() {
            await multimap.lock(car1);
        });

        it('isLocked', async function() {
            await multimap.isLocked(car1);
        });

        it('tryLock', async function() {
            await multimap.tryLock(car1);
        });

        it('unlock', async function() {
            await multimap.unlock(car1);
        });

        it('forceUnlock', async function() {
            await multimap.forceUnlock(car1);
        });

        it('putAll', async function() {
            await multimap.putAll([car1, car2], [car2, car3], [car1, car3]);
        });
    });

    describe('ReplicatedMap', function() {
        it('put', async function() {
            await replicatedMap.put(car1, car2);
        });

        it('get', async function() {
            await replicatedMap.get(car1);
        });

        it('containsKey', async function() {
            await replicatedMap.containsKey(car1);
        });

        it('containsValue', async function() {
            await replicatedMap.containsValue(car1);
        });

        it('remove', async function() {
            await replicatedMap.remove(car1);
        });

        it('putAll', async function() {
            await replicatedMap.putAll([car1, car2], [car2, car3]);
        });

        it('addEntryListenerToKeyWithPredicate', async function() {
            await replicatedMap.addEntryListenerToKeyWithPredicate(() => {}, car2);
        });

        it('addEntryListenerToKey', async function() {
            await replicatedMap.addEntryListenerToKey(() => {}, car2);
        });
    });

    describe('List', function() {
        it('add', async function() {
            await list.add(car1);
        });

        it('addAt', async function() {
            await list.addAt(0, car1);
        });

        it('addAll', async function() {
            await list.addAll([car1, car2]);
        });

        it('addAllAt', async function() {
            await list.addAllAt(1, [car1, car2]);
        });

        it('contains', async function() {
            await list.contains(car1);
        });

        it('containsAll', async function() {
            await list.containsAll([car1, car2]);
        });

        it('indexOf', async function() {
            await list.indexOf(car1);
        });

        it('lastIndexOf', async function() {
            await list.lastIndexOf(car1);
        });

        it('remove', async function() {
            await list.remove(car1);
        });

        it('removeAll', async function() {
            await list.removeAll([car1, car2]);
        });

        it('retainAll', async function() {
            await list.retainAll([car1, car2]);
        });

        it('set', async function() {
            await list.set(0, car1);
        });
    });

    describe('AtomicReference', function() {
        it('compareAndSet', async function() {
            await atomicReference.compareAndSet(car1, car2);
        });

        it('set', async function() {
            await atomicReference.set(car1);
        });

        it('getAndSet', async function() {
            await atomicReference.getAndSet(car1);
        });

        it('contains', async function() {
            await atomicReference.contains(car1);
        });
    });

    describe('Queue', function() {
        it('add', async function() {
            await queue.add(car1);
        });

        it('addAll', async function() {
            await queue.addAll([car1, car2]);
        });

        it('contains', async function() {
            await queue.contains(car1);
        });

        it('containsAll', async function() {
            await queue.containsAll([car1, car2]);
        });

        it('offer', async function() {
            await queue.offer(car1);
        });

        it('put', async function() {
            await queue.put(car1);
        });

        it('remove', async function() {
            await queue.remove(car1);
        });

        it('removeAll', async function() {
            await queue.removeAll([car1, car2]);
        });

        it('retainAll', async function() {
            await queue.retainAll([car1, car2]);
        });
    });

    describe('Set', function() {
        it('add', async function() {
            await set.add(car1);
        });

        it('addAll', async function() {
            await set.addAll([car1, car2]);
        });

        it('contains', async function() {
            await set.contains(car1);
        });

        it('containsAll', async function() {
            await set.containsAll([car1, car2]);
        });

        it('remove', async function() {
            await set.remove(car1);
        });

        it('removeAll', async function() {
            await set.removeAll([car1, car2]);
        });

        it('retainAll', async function() {
            await set.retainAll([car1, car2]);
        });
    });

    describe('ReliableTopic', function() {
        it('publish', async function() {
            await topic.publish(car1);
        });
    });

    describe('RingBuffer', function() {
        it('add', async function() {
            await ringBuffer.add(car1);
        });

        it('addAll', async function() {
            await ringBuffer.addAll([car1, car2]);
        });
    });
});
