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
/** @ignore *//** */

import * as Long from 'long';
import {PNCounterAddCodec} from '../codec/PNCounterAddCodec';
import {PNCounterGetCodec} from '../codec/PNCounterGetCodec';
import {PNCounterGetConfiguredReplicaCountCodec} from '../codec/PNCounterGetConfiguredReplicaCountCodec';
import {dataMemberSelector} from '../core/MemberSelector';
import {VectorClock} from './VectorClock';
import {NoDataMemberInClusterError} from '../core';
import {randomInt} from '../util/Util';
import {BaseProxy} from './BaseProxy';
import {PNCounter} from './PNCounter';
import {MemberImpl} from '../core/Member';

/** @internal */
export class PNCounterProxy extends BaseProxy implements PNCounter {
    private static readonly EMPTY_ARRAY: MemberImpl[] = [];
    private lastObservedVectorClock: VectorClock = new VectorClock();
    private maximumReplicaCount = 0;
    private currentTargetReplicaAddress: MemberImpl;

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
            delta = Long.fromNumber(delta as number);
        }
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, (delta as Long).neg(), true);
    }

    subtractAndGet(delta: Long | number): Promise<Long> {
        if (!Long.isLong(delta)) {
            delta = Long.fromNumber(delta as number);
        }
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec, (delta as Long).neg(), false);
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

    private invokeInternal(excludedAddresses: MemberImpl[], lastError: any, codec: any, ...codecArgs: any[]): Promise<Long> {
        return this.getCRDTOperationTarget(excludedAddresses).then((target) => {
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

    private encodeInvokeInternal<T>(target: MemberImpl, codec: any, ...codecArguments: any[]): Promise<T> {
        return this.encodeInvokeOnTarget(codec, target.uuid, ...codecArguments,
            this.lastObservedVectorClock.entrySet(), target.uuid)
            .then((clientMessage) => {
                return codec.decodeResponse(clientMessage);
            });
    }

    private getCRDTOperationTarget(excludedAddresses: MemberImpl[]): Promise<MemberImpl> {
        if (this.currentTargetReplicaAddress != null &&
            !excludedAddresses.some(this.currentTargetReplicaAddress.equals.bind(this.currentTargetReplicaAddress))) {
            return Promise.resolve(this.currentTargetReplicaAddress);
        } else {
            return this.chooseTargetReplica(excludedAddresses).then((target) => {
                this.currentTargetReplicaAddress = target;
                return target;
            });
        }
    }

    private chooseTargetReplica(excludedAddresses: MemberImpl[]): Promise<MemberImpl> {
        return this.getReplicaAddresses(excludedAddresses).then((replicaAddresses) => {
            if (replicaAddresses.length === 0) {
                return null;
            }
            return replicaAddresses[randomInt(replicaAddresses.length)];
        });
    }

    private getReplicaAddresses(excludedAddresses: MemberImpl[]): Promise<MemberImpl[]> {
        const dataMembers = this.client.getClusterService().getMembers(dataMemberSelector);
        return this.getMaxConfiguredReplicaCount().then((replicaCount: number) => {
            const currentCount = Math.min(replicaCount, dataMembers.length);
            const replicaAddresses: MemberImpl[] = [];
            for (let i = 0; i < currentCount; i++) {
                const memberAddress = dataMembers[i];
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
            return this.encodeInvokeOnRandomTarget(PNCounterGetConfiguredReplicaCountCodec)
                .then((clientMessage) => {
                    const response = PNCounterGetConfiguredReplicaCountCodec.decodeResponse(clientMessage);
                    this.maximumReplicaCount = response.response;
                    return this.maximumReplicaCount;
                });
        }
    }

    private updateObservedReplicaTimestamps(observedTimestamps: Array<[string, Long]>): void {
        const observedClock = this.toVectorClock(observedTimestamps);
        if (observedClock.isAfter(this.lastObservedVectorClock)) {
            this.lastObservedVectorClock = observedClock;
        }
    }

    private toVectorClock(timestamps: Array<[string, Long]>): VectorClock {
        const vectorClock = new VectorClock();
        timestamps.forEach((entry: [string, Long]) => {
            vectorClock.setReplicaTimestamp(entry[0], entry[1]);
        });
        return vectorClock;
    }

}
