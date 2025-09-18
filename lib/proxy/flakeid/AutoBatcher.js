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
exports.AutoBatcher = exports.Batch = void 0;
const events_1 = require("events");
const Util_1 = require("../../util/Util");
/** @internal */
class Batch {
    constructor(validityMillis, base, increment, batchSize) {
        this.nextIdLong = base;
        this.increment = increment;
        this.firstInvalidId = base.add(this.increment.multiply(batchSize));
        if (validityMillis > 0) {
            this.invalidSince = validityMillis + Date.now();
        }
        else {
            this.invalidSince = Number.MAX_SAFE_INTEGER;
        }
    }
    /**
     * @returns next id from the batch,
     *          undefined if ids are exhausted or not valid anymore
     */
    nextId() {
        if (this.invalidSince <= Date.now()) {
            return undefined;
        }
        if (this.firstInvalidId.equals(this.nextIdLong)) {
            return undefined;
        }
        const returnLong = this.nextIdLong;
        this.nextIdLong = this.nextIdLong.add(this.increment);
        return returnLong;
    }
}
exports.Batch = Batch;
/** @internal */
class AutoBatcher {
    constructor(supplier) {
        this.queue = [];
        this.requestInFlight = false;
        this.emitter = new events_1.EventEmitter();
        this.supplier = supplier;
        this.emitter.on(AutoBatcher.NEW_BATCH_AVAILABLE, this.processIdRequests.bind(this));
        this.emitter.on('error', this.rejectAll.bind(this));
    }
    processIdRequests() {
        let ind = 0;
        while (ind < this.queue.length) {
            let nextId;
            if (this.batch != null && (nextId = this.batch.nextId()) != null) {
                this.queue[ind].resolve(nextId);
                ind++;
            }
            else {
                this.assignNewBatch();
                break;
            }
        }
        this.queue.splice(0, ind);
    }
    nextId() {
        const deferred = (0, Util_1.deferredPromise)();
        this.queue.push(deferred);
        this.processIdRequests();
        return deferred.promise;
    }
    assignNewBatch() {
        if (this.requestInFlight) {
            return;
        }
        this.requestInFlight = true;
        this.supplier().then((batch) => {
            this.requestInFlight = false;
            this.batch = batch;
            this.emitter.emit(AutoBatcher.NEW_BATCH_AVAILABLE);
        }).catch((e) => {
            this.requestInFlight = false;
            this.emitter.emit('error', e);
        });
    }
    rejectAll(e) {
        this.queue.forEach((deferred) => {
            deferred.reject(e);
        });
        this.queue = [];
    }
}
exports.AutoBatcher = AutoBatcher;
AutoBatcher.NEW_BATCH_AVAILABLE = 'newBatch';
//# sourceMappingURL=AutoBatcher.js.map