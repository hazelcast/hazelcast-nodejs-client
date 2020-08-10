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
import {UUID} from '../core/UUID';

/** @internal */
export class MetadataContainer {

    private sequence: Long = Long.fromNumber(0);
    private staleSequence: Long = Long.fromNumber(0);
    private missedSequenceCount: Long = Long.fromNumber(0);
    private uuid: UUID;

    reset(): void {
        this.sequence = Long.fromNumber(0);
        this.staleSequence = Long.fromNumber(0);
        this.missedSequenceCount = Long.fromNumber(0);
    }

    setSequence(sequence: Long): void {
        this.sequence = sequence;
    }

    getSequence(): Long {
        return this.sequence;
    }

    setStaleSequence(staleSequence: Long): void {
        this.staleSequence = staleSequence;
    }

    getStaleSequence(): Long {
        return this.staleSequence;
    }

    increaseMissedSequenceCount(missed: Long): void {
        this.missedSequenceCount = this.missedSequenceCount.add(missed);
    }

    getMissedSequenceCount(): Long {
        return this.missedSequenceCount;
    }

    setUuid(uuid: UUID): void {
        this.uuid = uuid;
    }

    getUuid(): UUID {
        return this.uuid;
    }
}
