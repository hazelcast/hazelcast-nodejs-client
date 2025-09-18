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
exports.DataRecord = void 0;
const Long = require("long");
/** @internal */
class DataRecord {
    constructor(key, value, creationTime, ttl) {
        this.key = key;
        this.value = value;
        this.ttl = ttl;
        if (creationTime) {
            this.creationTime = creationTime;
        }
        else {
            this.creationTime = Date.now();
        }
        if (ttl) {
            this.expirationTime = this.creationTime + ttl * 1000;
        }
        else {
            this.expirationTime = undefined;
        }
        this.lastAccessTime = this.creationTime;
        this.accessHit = 0;
        this.invalidationSequence = Long.fromNumber(0);
        this.uuid = null;
        this.status = DataRecord.READ_PERMITTED;
    }
    static lruComp(x, y) {
        return x.lastAccessTime - y.lastAccessTime;
    }
    static lfuComp(x, y) {
        return x.accessHit - y.accessHit;
    }
    static randomComp(_x, _y) {
        return Math.random() - 0.5;
    }
    isExpired(maxIdleSeconds) {
        const now = Date.now();
        return (this.expirationTime > 0 && this.expirationTime < now) ||
            (maxIdleSeconds > 0 && this.lastAccessTime + maxIdleSeconds * 1000 < now);
    }
    setAccessTime() {
        this.lastAccessTime = Date.now();
    }
    hitRecord() {
        this.accessHit++;
    }
    getInvalidationSequence() {
        return this.invalidationSequence;
    }
    setInvalidationSequence(sequence) {
        this.invalidationSequence = sequence;
    }
    hasSameUuid(uuid) {
        return uuid != null && this.uuid != null && this.uuid.equals(uuid);
    }
    setUuid(uuid) {
        this.uuid = uuid;
    }
    casStatus(expected, update) {
        if (expected.equals(this.status)) {
            this.status = update;
            return true;
        }
        return false;
    }
    getStatus() {
        return this.status;
    }
    setCreationTime(creationTime) {
        if (creationTime) {
            this.creationTime = creationTime;
        }
        else {
            this.creationTime = Date.now();
        }
        if (this.ttl) {
            this.expirationTime = this.creationTime + this.ttl * 1000;
        }
        else {
            this.expirationTime = undefined;
        }
    }
}
exports.DataRecord = DataRecord;
DataRecord.NOT_RESERVED = Long.NEG_ONE;
DataRecord.RESERVED = Long.fromNumber(-2);
DataRecord.READ_PERMITTED = Long.fromNumber(-3);
//# sourceMappingURL=DataRecord.js.map