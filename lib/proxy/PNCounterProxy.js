"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PNCounterProxy = void 0;
const Long = require("long");
const PNCounterAddCodec_1 = require("../codec/PNCounterAddCodec");
const PNCounterGetCodec_1 = require("../codec/PNCounterGetCodec");
const PNCounterGetConfiguredReplicaCountCodec_1 = require("../codec/PNCounterGetConfiguredReplicaCountCodec");
const MemberSelector_1 = require("../core/MemberSelector");
const VectorClock_1 = require("./VectorClock");
const core_1 = require("../core");
const Util_1 = require("../util/Util");
const BaseProxy_1 = require("./BaseProxy");
/** @internal */
class PNCounterProxy extends BaseProxy_1.BaseProxy {
    constructor() {
        super(...arguments);
        this.lastObservedVectorClock = new VectorClock_1.VectorClock();
        this.maximumReplicaCount = 0;
    }
    get() {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterGetCodec_1.PNCounterGetCodec);
    }
    getAndAdd(delta) {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec_1.PNCounterAddCodec, delta, true);
    }
    addAndGet(delta) {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec_1.PNCounterAddCodec, delta, false);
    }
    getAndSubtract(delta) {
        if (!Long.isLong(delta)) {
            delta = Long.fromNumber(delta);
        }
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec_1.PNCounterAddCodec, delta.neg(), true);
    }
    subtractAndGet(delta) {
        if (!Long.isLong(delta)) {
            delta = Long.fromNumber(delta);
        }
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec_1.PNCounterAddCodec, delta.neg(), false);
    }
    decrementAndGet() {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec_1.PNCounterAddCodec, Long.fromNumber(-1), false);
    }
    incrementAndGet() {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec_1.PNCounterAddCodec, Long.fromNumber(1), false);
    }
    getAndDecrement() {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec_1.PNCounterAddCodec, Long.fromNumber(-1), true);
    }
    getAndIncrement() {
        return this.invokeInternal(PNCounterProxy.EMPTY_ARRAY, null, PNCounterAddCodec_1.PNCounterAddCodec, Long.fromNumber(1), true);
    }
    reset() {
        this.lastObservedVectorClock = new VectorClock_1.VectorClock();
        return Promise.resolve();
    }
    invokeInternal(excludedAddresses, lastError, codec, ...codecArgs) {
        return this.getCRDTOperationTarget(excludedAddresses).then((target) => {
            if (target == null) {
                if (lastError) {
                    throw lastError;
                }
                else {
                    throw new core_1.NoDataMemberInClusterError('Cannot invoke operations on a CRDT ' +
                        'because the cluster does not contain any data members');
                }
            }
            return this.encodeInvokeInternal(target, codec, ...codecArgs).then((result) => {
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
    encodeInvokeInternal(target, codec, ...codecArguments) {
        return this.encodeInvokeOnTarget(codec, target.uuid, (clientMessage) => {
            return codec.decodeResponse(clientMessage);
        }, ...codecArguments, this.lastObservedVectorClock.entrySet(), target.uuid);
    }
    getCRDTOperationTarget(excludedAddresses) {
        if (this.currentTargetReplicaAddress != null &&
            !excludedAddresses.some(this.currentTargetReplicaAddress.equals.bind(this.currentTargetReplicaAddress))) {
            return Promise.resolve(this.currentTargetReplicaAddress);
        }
        else {
            return this.chooseTargetReplica(excludedAddresses).then((target) => {
                this.currentTargetReplicaAddress = target;
                return target;
            });
        }
    }
    chooseTargetReplica(excludedAddresses) {
        return this.getReplicaAddresses(excludedAddresses).then((replicaAddresses) => {
            if (replicaAddresses.length === 0) {
                return null;
            }
            return replicaAddresses[(0, Util_1.randomInt)(replicaAddresses.length)];
        });
    }
    getReplicaAddresses(excludedAddresses) {
        const dataMembers = this.clusterService.getMembers(MemberSelector_1.dataMemberSelector);
        return this.getMaxConfiguredReplicaCount().then((replicaCount) => {
            const currentCount = Math.min(replicaCount, dataMembers.length);
            const replicaAddresses = [];
            for (let i = 0; i < currentCount; i++) {
                const memberAddress = dataMembers[i];
                if (!excludedAddresses.some(memberAddress.equals.bind(memberAddress))) {
                    replicaAddresses.push(memberAddress);
                }
            }
            return replicaAddresses;
        });
    }
    getMaxConfiguredReplicaCount() {
        if (this.maximumReplicaCount > 0) {
            return Promise.resolve(this.maximumReplicaCount);
        }
        else {
            return this.encodeInvokeOnRandomTarget(PNCounterGetConfiguredReplicaCountCodec_1.PNCounterGetConfiguredReplicaCountCodec, (clientMessage) => {
                this.maximumReplicaCount = PNCounterGetConfiguredReplicaCountCodec_1.PNCounterGetConfiguredReplicaCountCodec.decodeResponse(clientMessage);
                return this.maximumReplicaCount;
            });
        }
    }
    updateObservedReplicaTimestamps(observedTimestamps) {
        const observedClock = this.toVectorClock(observedTimestamps);
        if (observedClock.isAfter(this.lastObservedVectorClock)) {
            this.lastObservedVectorClock = observedClock;
        }
    }
    toVectorClock(timestamps) {
        const vectorClock = new VectorClock_1.VectorClock();
        timestamps.forEach((entry) => {
            vectorClock.setReplicaTimestamp(entry[0], entry[1]);
        });
        return vectorClock;
    }
}
exports.PNCounterProxy = PNCounterProxy;
PNCounterProxy.EMPTY_ARRAY = [];
//# sourceMappingURL=PNCounterProxy.js.map