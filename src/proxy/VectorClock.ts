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
/** @ignore *//** */

/** @internal */
export class VectorClock {

    private replicaTimestamps = new Map<string, Long>();

    isAfter(other: VectorClock): boolean {
        let atLeastOneBigger = false;
        other.replicaTimestamps.forEach((otherTimestamp: Long, replicaId: string) => {
            const thisTimestamp = this.replicaTimestamps.get(replicaId);
            if (thisTimestamp == null || otherTimestamp.greaterThan(thisTimestamp)) {
                return false;
            } else if (otherTimestamp.lessThan(thisTimestamp)) {
                atLeastOneBigger = true;
            }
        });
        return atLeastOneBigger || this.replicaTimestamps.size > other.replicaTimestamps.size;
    }

    setReplicaTimestamp(replicaId: string, timestamp: Long): void {
        this.replicaTimestamps.set(replicaId, timestamp);
    }

    entrySet(): Array<[string, Long]> {
        const entrySet: Array<[string, Long]> = [];
        this.replicaTimestamps.forEach((timestamp: Long, replicaId: string) => {
            entrySet.push([replicaId, timestamp]);
        });
        return entrySet;
    }
}
