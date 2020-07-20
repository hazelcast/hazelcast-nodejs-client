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

import * as Long from 'long';
import {UUID} from '../core/UUID';
import {Data} from '../serialization/Data';

export class DataRecord {

    static readonly NOT_RESERVED = Long.NEG_ONE;
    static readonly RESERVED = Long.fromNumber(-2);
    static readonly READ_PERMITTED = Long.fromNumber(-3);
    key: Data;
    value: Data | any;
    private creationTime: number;
    private expirationTime: number;
    private lastAccessTime: number;
    private accessHit: number;
    private invalidationSequence: Long;
    private uuid: UUID;
    private status: Long;
    private ttl: number;

    constructor(key: Data, value: Data | any, creationTime?: number, ttl?: number) {
        this.key = key;
        this.value = value;
        this.ttl = ttl;
        if (creationTime) {
            this.creationTime = creationTime;
        } else {
            this.creationTime = Date.now();
        }
        if (ttl) {
            this.expirationTime = this.creationTime + ttl * 1000;
        } else {
            this.expirationTime = undefined;
        }
        this.lastAccessTime = this.creationTime;
        this.accessHit = 0;
        this.invalidationSequence = Long.fromNumber(0);
        this.uuid = null;
        this.status = DataRecord.READ_PERMITTED;
    }

    public static lruComp(x: DataRecord, y: DataRecord): number {
        return x.lastAccessTime - y.lastAccessTime;
    }

    public static lfuComp(x: DataRecord, y: DataRecord): number {
        return x.accessHit - y.accessHit;
    }

    public static randomComp(x: DataRecord, y: DataRecord): number {
        return Math.random() - 0.5;
    }

    isExpired(maxIdleSeconds: number): boolean {
        const now = Date.now();
        if ((this.expirationTime > 0 && this.expirationTime < now) ||
            (maxIdleSeconds > 0 && this.lastAccessTime + maxIdleSeconds * 1000 < now)) {
            return true;
        } else {
            return false;
        }
    }

    setAccessTime(): void {
        this.lastAccessTime = Date.now();
    }

    hitRecord(): void {
        this.accessHit++;
    }

    getInvalidationSequence(): Long {
        return this.invalidationSequence;
    }

    setInvalidationSequence(sequence: Long): void {
        this.invalidationSequence = sequence;
    }

    hasSameUuid(uuid: UUID): boolean {
        return uuid != null && this.uuid != null && this.uuid.equals(uuid);
    }

    setUuid(uuid: UUID): void {
        this.uuid = uuid;
    }

    casStatus(expected: Long, update: Long): boolean {
        if (expected.equals(this.status)) {
            this.status = update;
            return true;
        }
        return false;
    }

    getStatus(): Long {
        return this.status;
    }

    setCreationTime(creationTime?: number): void {
        if (creationTime) {
            this.creationTime = creationTime;
        } else {
            this.creationTime = Date.now();
        }
        if (this.ttl) {
            this.expirationTime = this.creationTime + this.ttl * 1000;
        } else {
            this.expirationTime = undefined;
        }
    }
}
