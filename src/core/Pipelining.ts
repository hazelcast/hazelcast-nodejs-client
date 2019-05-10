/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import * as Promise from 'bluebird';
import {assertNotNull, assertPositive} from '../Util';

/**
 * The Pipelining can be used to speed up requests. It is build on top of asynchronous
 * requests.
 *
 * The main purpose of the Pipelining is to control the number of concurrent requests
 * when using asynchronous invocations. This can be done by setting the depth using
 * the constructor. So you could set the depth to e.g 100 and do 1000 calls. That means
 * that at any given moment, there will only be 100 concurrent requests.
 *
 * It depends on the situation what the optimal depth (number of invocations in
 * flight) should be. If it is too high, you can run into memory related problems.
 * If it is too low, it will provide little or no performance advantage at all. In
 * most cases a Pipelining and a few hundred asynchronous calls should not lead to any
 * problems. For testing purposes we frequently have a Pipelining of 1000 or more
 * concurrent requests to be able to saturate the system.
 *
 * A Pipelining provides its own backpressure on the system. So there will not be more
 * in flight invocations than the depth of the Pipelining. This means that the Pipelining
 * will work fine when backpressure on the member is disabled (default). Also
 * when it it enabled it will work fine, but keep in mind that the number of concurrent
 * invocations in the Pipelining could be lower than the configured number of invocation
 * of the Pipelining because the backpressure on the member is leading.
 *
 * The Pipelining has been marked as Beta since we need to see how the API needs to
 * evolve. But there is no problem using it in production. We use similar techniques
 * to achieve high performance.
 *
 * @param E
 */
export class Pipelining<E> {
    private readonly depth: number;
    private readonly next: () => void;
    private loadGenerator: () => Promise<E>;
    private rejected: boolean = false;
    private done: boolean = false;
    private resolve: (thenableOrResult?: (void | E[]) | PromiseLike<void | E[]>) => void;
    private reject: (err?: any) => void;
    private resolvingCount: number = 0;
    private index: number = 0;
    private results: E[] = [];

    /**
     * Creates a Pipelining with the given depth and load generator.
     *
     * @param depth the maximum number of concurrent calls allowed in this Pipelining.
     * @param loadGenerator a generator-like function that returns a promise
     *  or null if the generator is exhausted.
     * @param storeResults a boolean value indicating that whether the results of the requests
     *  should be stored in the Pipelining or not. If this value is set to false, it is expected
     *  from the user to handle the results of the requests within the load generator. It is false
     *  by default.
     * @throws {AssertionError} if the depth is smaller than 1.
     * @throws {AssertionError} if the load generator is null.
     */
    constructor(depth: number, loadGenerator: () => Promise<E>, storeResults: boolean = false) {
        assertPositive(depth, 'depth should be positive');
        assertNotNull(loadGenerator, 'load generator cannot be null');
        this.depth = depth;
        this.loadGenerator = loadGenerator;
        if (storeResults) {
            this.next = this.nextWithResults;
        } else {
            this.next = this.nextWithoutResults;
        }
    }

    /**
     * If the Pipelining is constructed to store the results, results will be
     * returned with order the requests were done when all of the requests
     * are completed.
     *
     * If not, it will return void when all of the requests are completed.
     *
     * @throws {Error} if any of the requests fails
     * @returns array of the results or void
     */
    run(): Promise<void | E[]> {
        this.reset();
        return new Promise<void | E[]>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;

            for (let i = 0; i < this.depth; i++) {
                this.next();
                if (this.done) {
                    break;
                }
            }
        });
    }

    /**
     * Sets a new load generator for this Pipelining.
     *
     * @param loadGenerator a generator-like function that returns a promise
     *  or null if the generator is exhausted.
     *
     * @throws {AssertionError} if the load generator is null.
     */
    setLoadGenerator(loadGenerator: () => Promise<E>): void {
        assertNotNull(loadGenerator, 'load generator cannot be null');
        this.loadGenerator = loadGenerator;
    }

    private nextWithoutResults(): void {
        if (this.rejected) {
            return;
        }

        const promise = this.loadGenerator();
        if (promise == null) {
            this.done = true;
            if (this.resolvingCount === 0) {
                this.resolve();
            }
            return;
        }

        this.resolvingCount++;
        promise.then(() => {
           this.resolvingCount--;
           this.next();
        }).catch((err) => {
            this.rejected = true;
            this.reject(err);
        });
    }

    private nextWithResults(): void {
        if (this.rejected) {
            return;
        }

        const promise = this.loadGenerator();
        const i = this.index++;

        if (promise == null) {
            this.done = true;
            if (this.resolvingCount === 0) {
                this.resolve(this.results);
            }
            return;
        }

        this.resolvingCount++;
        promise.then((value) => {
           this.results[i] = value;
           this.resolvingCount--;
           this.next();
        }).catch((err) => {
            this.rejected = true;
            this.reject(err);
        });
    }

    private reset(): void {
        this.rejected = false;
        this.done = false;
        this.resolvingCount = 0;
        this.index = this.results.length;
    }
}
