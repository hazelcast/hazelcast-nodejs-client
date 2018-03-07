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

import {EventEmitter} from 'events';
import * as Long from 'long';
import * as Promise from 'bluebird';

export class Batch {
    private base: Long;
    private increment: Long;
    private batchSize: number;
    private invalidSince: Long;
    private lastIndex: number = 0;

    constructor(validityMillis: Long, base: Long, increment: Long, batchSize: number) {
        this.base = base;
        this.increment = increment;
        this.batchSize = batchSize;
        if (validityMillis.greaterThan(0)) {
            this.invalidSince = validityMillis.add(Date.now());
        } else {
            this.invalidSince = Long.MAX_VALUE;
        }
    }

    /**
     * @returns next id from the batch,
     *          undefined if ids are exhausted or not valid anymore
     */
    nextId(): Long {
        if (this.invalidSince.lessThanOrEqual(Date.now())) {
            return undefined;
        }
        if (this.lastIndex === this.batchSize) {
            return undefined;
        }
        let returnLong = this.base.add(this.increment.multiply(this.lastIndex));
        this.lastIndex++;
        return returnLong;
    }
}

export class AutoBatcher {

    private readonly NEW_BATCH_AVAILABLE = 'newBatch';

    private quee: Array<Promise.Resolver<Long>> = [];
    private batch: Batch;
    private requestInFlight: boolean = false;
    private supplier: () => Promise<any>;
    private validMilliseconds: Long;
    private emitter = new EventEmitter();

    constructor(validMilliseconds: Long, supplier: () => Promise<any>) {
        this.validMilliseconds = validMilliseconds;
        this.supplier = supplier;
        this.emitter.on(this.NEW_BATCH_AVAILABLE, this.processIdRequests.bind(this));
        this.emitter.on('error', this.rejectAll.bind(this));
    }

    processIdRequests(): void {
        let ind = 0;
        while (ind < this.quee.length) {
            let nextId: Long;
            if (this.batch != null && (nextId = this.batch.nextId()) != null) {
                this.quee[ind].resolve(nextId);
                ind++;
            } else {
                this.assignNewBatch();
                break;
            }
        }
        this.quee.splice(0, ind);
    }

    private assignNewBatch(): void {
        if (this.requestInFlight) {
            return;
        }
        this.requestInFlight = true;
        this.supplier().then((batch: Batch) => {
            this.requestInFlight = false;
            this.batch = batch;
            this.emitter.emit(this.NEW_BATCH_AVAILABLE);
        }).catch((e) => {
            this.requestInFlight = false;
            this.emitter.emit('error', e);
        });
    }

    private rejectAll(e: Error): void {
        this.quee.forEach((deferred: Promise.Resolver<Long>) => {
            deferred.reject(e);
        });
        this.quee = [];
    }

    nextId(): Promise<Long> {
        let deferred = Promise.defer<Long>();
        this.quee.push(deferred);
        this.processIdRequests();
        return deferred.promise;
    }
}
