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

import {
    IAtomicLong,
    IAtomicReference,
    ICountDownLatch,
    FencedLock,
    ISemaphore
} from './proxy';
import {CPProxyManager} from './proxy/cpsubsystem/CPProxyManager';
import {CPSessionManager} from './proxy/cpsubsystem/CPSessionManager';
import {InvocationService} from './invocation/InvocationService';
import {SerializationService} from './serialization/SerializationService';
import {ILogger} from './logging';

/**
 * CP Subsystem is a component of Hazelcast that builds a strongly consistent
 * layer for a set of distributed data structures. Its APIs can be used for
 * implementing distributed coordination use cases, such as leader election,
 * distributed locking, synchronization, and metadata management.
 *
 * Its data structures are CP with respect to the CAP principle, i.e., they
 * always maintain linearizability and prefer consistency over availability
 * during network partitions. Besides network partitions, CP Subsystem
 * withstands server and client failures.
 *
 * Data structures in CP Subsystem run in CP groups. Each CP group elects
 * its own Raft leader and runs the Raft consensus algorithm independently.
 *
 * The CP data structures differ from the other Hazelcast data structures
 * in two aspects. First, an internal commit is performed on the METADATA CP
 * group every time you fetch a proxy from this interface. Hence, callers
 * should cache returned proxy objects. Second, if you call
 * `DistributedObject.destroy()` on a CP data structure proxy, that data
 * structure is terminated on the underlying CP group and cannot be
 * reinitialized until the CP group is force-destroyed. For this
 * reason, please make sure that you are completely done with a CP data
 * structure before destroying its proxy.
 */
export interface CPSubsystem {

    /**
     * Returns the distributed AtomicLong instance with given name.
     * The instance is created on CP Subsystem.
     *
     * If no group name is given within the `name` argument, then the
     * AtomicLong instance will be created on the DEFAULT CP group.
     * If a group name is given, like `.getAtomicLong('myLong@group1')`,
     * the given group will be initialized first, if not initialized
     * already, and then the instance will be created on this group.
     *
     * @throws AssertionError if `name` is not a `string`
     */
    getAtomicLong(name: string): Promise<IAtomicLong>;

    /**
     * Returns the distributed AtomicReference instance with given name.
     * The instance is created on CP Subsystem.
     *
     * If no group name is given within the `name` argument, then the
     * AtomicLong instance will be created on the DEFAULT CP group.
     * If a group name is given, like `.getAtomicReference('myRef@group1')`,
     * the given group will be initialized first, if not initialized
     * already, and then the instance will be created on this group.
     *
     * @throws AssertionError if `name` is not a `string`
     */
    getAtomicReference<E>(name: string): Promise<IAtomicReference<E>>;

    /**
     * Returns the distributed CountDownLatch instance with given name.
     * The instance is created on CP Subsystem.
     *
     * If no group name is given within the `name` argument, then the
     * ICountDownLatch instance will be created on the DEFAULT CP group.
     * If a group name is given, like `.getCountDownLatch('myLatch@group1')`,
     * the given group will be initialized first, if not initialized
     * already, and then the instance will be created on this group.
     *
     * @throws AssertionError if `name` is not a `string`
     */
    getCountDownLatch(name: string): Promise<ICountDownLatch>;

    /**
     * Returns the distributed FencedLock instance with given name.
     * The instance is created on CP Subsystem.
     *
     * If no group name is given within the `name` argument, then the
     * FencedLock instance will be created on the DEFAULT CP group.
     * If a group name is given, like `.getLock('myLock@group1')`,
     * the given group will be initialized first, if not initialized
     * already, and then the instance will be created on this group.
     *
     * @throws AssertionError if `name` is not a `string`
     */
    getLock(name: string): Promise<FencedLock>;

    /**
     * Returns the distributed Semaphore instance with given name.
     * The instance is created on CP Subsystem.
     *
     * If no group name is given within the `name` argument, then the
     * Semaphore instance will be created on the DEFAULT CP group.
     * If a group name is given, like `.getSemaphore('mySemaphore@group1')`,
     * the given group will be initialized first, if not initialized
     * already, and then the instance will be created on this group.
     *
     * @throws AssertionError if `name` is not a `string`
     */
    getSemaphore(name: string): Promise<ISemaphore>;

}

/**
 * Creates CP proxies.
 * @internal
 */
export class CPSubsystemImpl implements CPSubsystem {

    private readonly cpProxyManager: CPProxyManager;
    private readonly cpSessionManager: CPSessionManager;

    constructor(
        logger: ILogger,
        clientName: string,
        invocationService: InvocationService,
        serializationService: SerializationService
    ) {
        this.cpSessionManager = new CPSessionManager(
            logger,
            clientName,
            invocationService
        );
        this.cpProxyManager = new CPProxyManager(
            invocationService,
            serializationService,
            this.cpSessionManager
        );
    }

    getAtomicLong(name: string): Promise<IAtomicLong> {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager.ATOMIC_LONG_SERVICE) as Promise<IAtomicLong>;
    }

    getAtomicReference<E>(name: string): Promise<IAtomicReference<E>> {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager.ATOMIC_REF_SERVICE) as Promise<IAtomicReference<E>>;
    }

    getCountDownLatch(name: string): Promise<ICountDownLatch> {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager.LATCH_SERVICE) as Promise<ICountDownLatch>;
    }

    getLock(name: string): Promise<FencedLock> {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager.LOCK_SERVICE) as Promise<FencedLock>;
    }

    getSemaphore(name: string): Promise<ISemaphore> {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager.SEMAPHORE_SERVICE) as Promise<ISemaphore>;
    }

    getCPSessionManager(): CPSessionManager {
        return this.cpSessionManager;
    }

    shutdown(): Promise<void> {
        return this.cpSessionManager.shutdown();
    }
}
