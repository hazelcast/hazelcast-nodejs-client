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

import * as Promise from 'bluebird';
import {IAtomicLong, FencedLock} from './proxy';
import {CPProxyManager} from './proxy/cpsubsystem/CPProxyManager';
import {CPSessionManager} from './proxy/cpsubsystem/CPSessionManager';
import {HazelcastClient} from './HazelcastClient';

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
     */
    getAtomicLong(name: string): Promise<IAtomicLong>;

    /**
     * Returns the distributed FencedLock instance instance with given name.
     * The instance is created on CP Subsystem.
     *
     * If no group name is given within the `name` argument, then the
     * FencedLock instance will be created on the DEFAULT CP group.
     * If a group name is given, like `.getLong('myLock@group1')`,
     * the given group will be initialized first, if not initialized
     * already, and then the instance will be created on this group.
     */
    getLock(name: string): Promise<FencedLock>;

}

/** @internal */
export class CPSubsystemImpl implements CPSubsystem {

    private readonly cpProxyManager: CPProxyManager;
    private readonly cpSessionManager: CPSessionManager;

    constructor(client: HazelcastClient) {
        this.cpProxyManager = new CPProxyManager(client);
        this.cpSessionManager = new CPSessionManager(client);
    }

    getAtomicLong(name: string): Promise<IAtomicLong> {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager.ATOMIC_LONG_SERVICE) as Promise<IAtomicLong>;
    }

    getLock(name: string): Promise<FencedLock> {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager.LOCK_SERVICE) as Promise<FencedLock>;
    }

    getCPSessionManager(): CPSessionManager {
        return this.cpSessionManager;
    }

    shutdown(): Promise<void> {
        return this.cpSessionManager.shutdown();
    }
}
