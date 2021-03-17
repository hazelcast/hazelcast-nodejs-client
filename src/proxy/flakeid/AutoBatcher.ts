/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {EventEmitter} from 'events';
import * as Long from 'long';
import {
    deferredPromise,
    DeferredPromise
} from '../../util/Util';

/** @internal */
export class Batch {

    private nextIdLong: Long;
    private readonly increment: Long;
    private readonly invalidSince: number;
    private firstInvalidId: Long;

    constructor(validityMillis: number, base: Long, increment: Long, batchSize: number) {
        this.nextIdLong = base;
        this.increment = increment;
        this.firstInvalidId = base.add(this.increment.multiply(batchSize));
        if (validityMillis > 0) {
            this.invalidSince = validityMillis + Date.now();
        } else {
            this.invalidSince = Number.MAX_SAFE_INTEGER;
        }
    }

    /**
     * @returns next id from the batch,
     *          undefined if ids are exhausted or not valid anymore
     */
    nextId(): Long {
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

/** @internal */
export class AutoBatcher {

    private static readonly NEW_BATCH_AVAILABLE = 'newBatch';

    private queue: Array<DeferredPromise<Long>> = [];
    private batch: Batch;
    private requestInFlight = false;
    private supplier: () => Promise<any>;
    private emitter = new EventEmitter();

    constructor(supplier: () => Promise<any>) {
        this.supplier = supplier;
        this.emitter.on(AutoBatcher.NEW_BATCH_AVAILABLE, this.processIdRequests.bind(this));
        this.emitter.on('error', this.rejectAll.bind(this));
    }

    processIdRequests(): void {
        let ind = 0;
        while (ind < this.queue.length) {
            let nextId: Long;
            if (this.batch != null && (nextId = this.batch.nextId()) != null) {
                this.queue[ind].resolve(nextId);
                ind++;
            } else {
                this.assignNewBatch();
                break;
            }
        }
        this.queue.splice(0, ind);
    }

    nextId(): Promise<Long> {
        const deferred = deferredPromise<Long>();
        this.queue.push(deferred);
        this.processIdRequests();
        return deferred.promise;
    }

    private assignNewBatch(): void {
        if (this.requestInFlight) {
            return;
        }
        this.requestInFlight = true;
        this.supplier().then((batch: Batch) => {
            this.requestInFlight = false;
            this.batch = batch;
            this.emitter.emit(AutoBatcher.NEW_BATCH_AVAILABLE);
        }).catch((e) => {
            this.requestInFlight = false;
            this.emitter.emit('error', e);
        });
    }

    private rejectAll(e: Error): void {
        this.queue.forEach((deferred: DeferredPromise<Long>) => {
            deferred.reject(e);
        });
        this.queue = [];
    }
}
