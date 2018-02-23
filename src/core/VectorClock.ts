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

import {IdentifiedDataSerializable} from '../serialization/Serializable';
import {DataInput, DataOutput} from '../serialization/Data';
import {ClusterDataFactoryHelper} from '../ClusterDataFactoryHelper';

export class VectorClock implements IdentifiedDataSerializable {

    private replicaTimestamps = new Map<string, Long>();

    isAfter(other: VectorClock): boolean {
        let atLeastOneBigger = false;
        other.replicaTimestamps.forEach((otherTimestamp: Long, replicaId: string) => {
            let thisTimetamp = this.replicaTimestamps.get(replicaId);
            if (thisTimetamp == null || otherTimestamp.greaterThan(thisTimetamp)) {
                return false;
            } else if (otherTimestamp.lessThan(thisTimetamp)) {
                atLeastOneBigger = true;
            }
        });
        return atLeastOneBigger || this.replicaTimestamps.size > other.replicaTimestamps.size;
    }

    setReplicaTimestamp(replicaId: string, timestamp: Long): void {
        this.replicaTimestamps.set(replicaId, timestamp);
    }

    entrySet(): Array<[string, Long]> {
        let entrySet: Array<[string, Long]> = [];
        this.replicaTimestamps.forEach((timestamp: Long, replicaId: string) => {
            entrySet.push([replicaId, timestamp]);
        });
        return entrySet;
    }

    readData(input: DataInput): any {
        let stateSize = input.readInt();
        for (let i = 0; i < stateSize; i++) {
            let replicaId = input.readUTF();
            let timestamp = input.readLong();
            this.replicaTimestamps.set(replicaId, timestamp);
        }
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.replicaTimestamps.size);
        this.replicaTimestamps.forEach((timestamp: Long, replicaId: string) => {
            output.writeUTF(replicaId);
            output.writeLong(timestamp);
        });
    }

    getFactoryId(): number {
        return ClusterDataFactoryHelper.FACTORY_ID;
    }

    getClassId(): number {
        return ClusterDataFactoryHelper.VECTOR_CLOCK;
    }
}
