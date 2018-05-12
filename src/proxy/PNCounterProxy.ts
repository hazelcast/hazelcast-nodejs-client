/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {BaseProxy} from './BaseProxy';
import {PNCounter} from './PNCounter';
import * as Promise from 'bluebird';
import {VectorClock} from '../core/VectorClock';
import {PNCounterGetConfiguredReplicaCountCodec} from '../codec/PNCounterGetConfiguredReplicaCountCodec';
import {MemberSelectors} from '../core/MemberSelectors';
import {randomInt} from '../Util';
import {PNCounterAddCodec} from '../codec/PNCounterAddCodec';
import {NoDataMemberInClusterError} from '../HazelcastError';
import {PNCounterGetCodec} from '../codec/PNCounterGetCodec';
import * as Long from 'long';
import Address = require('../Address');

export class PNCounterProxy extends BaseProxy implements PNCounter {
    private static readonly EMPTY_ARRAY: Address[] = [];
    private lastObservedVectorClock: VectorClock = new VectorClock();
    private maximumReplicaCount: number = 0;
    private currentTargetReplicaAddress: Address;

    get(): Promise<Long> {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterGetCodec);
    }

    getAndAdd(delta: Long | number): Promise<Long> {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, delta, true);
    }

    addAndGet(delta: Long | number): Promise<Long> {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, delta, false);
    }

    getAndSubtract(delta: Long | number): Promise<Long> {
        if (!Long.isLong(delta)) {
            delta = Long.fromNumber(<number>delta);
        }
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, (<Long>delta).neg(), true);
    }

    subtractAndGet(delta: Long | number): Promise<Long> {
        if (!Long.isLong(delta)) {
            delta = Long.fromNumber(<number>delta);
        }
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, (<Long>delta).neg(), false);
    }

    decrementAndGet(): Promise<Long> {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, Long.fromNumber(-1), false);
    }

    incrementAndGet(): Promise<Long> {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, Long.fromNumber(1), false);
    }

    getAndDecrement(): Promise<Long> {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, Long.fromNumber(-1), true);
    }

    getAndIncrement(): Promise<Long> {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, Long.fromNumber(1), true);
    }

    reset(): Promise<void> {
        this.lastObservedVectorClock = new VectorClock();
        return Promise.resolve();
    }

    private invokeInternal(excludedAddresses: Address[], lastError: any, codec: any, ...codecArgs: any[]): Promise<Long> {
        return this.getCRDTOperationTarget(excludedAddresses).then((target: Address) => {
            if (target == null) {
                if (lastError) {
                    throw lastError;
                } else {
                    throw new NoDataMemberInClusterError('Cannot invoke operations on a CRDT ' +
                        'because the cluster does not contain any data members');
                }
            }
            return this.encodeInvokeInternal<any>(target, codec, ...codecArgs).then((result) => {
                this.updateObservedReplicaTimestamps(result.replicaTimestamps);
                return result.value;
            }).catch((err) => {
                if (excludedAddresses === PNCounterProxy.EMPTY_ARRAY) {
                    excludedAddresses = [];
                }
                excludedAddresses.push(target);
                return this.invokeInternal(excludedAddresses, err, codec, ...codecArgs);
            });
        });
    }

    private encodeInvokeInternal<T>(target: Address, codec: any, ...codecArguments: any[]): Promise<T> {
        return this.encodeInvokeOnAddress<T>(codec, target, ...codecArguments, this.lastObservedVectorClock.entrySet(), target);
    }

    private getCRDTOperationTarget(excludedAddresses: Address[]): Promise<Address> {
        if (this.currentTargetReplicaAddress != null &&
            !excludedAddresses.some(this.currentTargetReplicaAddress.equals.bind(this.currentTargetReplicaAddress))) {
            return Promise.resolve(this.currentTargetReplicaAddress);
        } else {
            return this.chooseTargetReplica(excludedAddresses).then((target: Address) => {
                this.currentTargetReplicaAddress = target;
                return target;
            });
        }
    }

    private chooseTargetReplica(excludedAddresses: Address[]): Promise<Address> {
        return this.getReplicaAddresses(excludedAddresses).then((replicaAddresses: Address[]) => {
            if (replicaAddresses.length === 0) {
                return null;
            }
            return replicaAddresses[randomInt(replicaAddresses.length)];
        });
    }

    private getReplicaAddresses(excludedAddresses: Address[]): Promise<Address[]> {
        let dataMembers = this.client.getClusterService().getMembers(MemberSelectors.DATA_MEMBER_SELECTOR);
        return this.getMaxConfiguredReplicaCount().then((replicaCount: number) => {
            let currentCount = Math.min(replicaCount, dataMembers.length);
            let replicaAddresses: Address[] = [];
            for (let i = 0; i < currentCount; i++) {
                let memberAddress = dataMembers[i].address;
                if (!excludedAddresses.some(memberAddress.equals.bind(memberAddress))) {
                    replicaAddresses.push(memberAddress);
                }
            }
            return replicaAddresses;
        });
    }

    private getMaxConfiguredReplicaCount(): Promise<number> {
        if (this.maximumReplicaCount > 0) {
            return Promise.resolve(this.maximumReplicaCount);
        } else {
            return this.encodeInvokeOnRandomTarget<number>(PNCounterGetConfiguredReplicaCountCodec).then((count: number) => {
                this.maximumReplicaCount = count;
                return this.maximumReplicaCount;
            });
        }
    }

    private updateObservedReplicaTimestamps(observedTimestamps: Array<[string, Long]>): void {
        let observedClock = this.toVectorClock(observedTimestamps);
        if (observedClock.isAfter(this.lastObservedVectorClock)) {
            this.lastObservedVectorClock = observedClock;
        }
    }

    private toVectorClock(timestamps: Array<[string, Long]>): VectorClock {
        let vectorClock = new VectorClock();
        timestamps.forEach((entry: [string, Long]) => {
            vectorClock.setReplicaTimestamp(entry[0], entry[1]);
        });
        return vectorClock;
    }

}
