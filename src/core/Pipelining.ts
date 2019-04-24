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

import * as Promise from 'bluebird';
import {LoadGenerator} from './LoadGenerator';
import {assertPositive} from '../Util';

export class Pipelining<E> {
    private depth: number;
    private results: E[] = [];
    private loadGenerator: LoadGenerator<E>;
    private rejected: boolean = false;
    private done: boolean = false;
    private resolveAll: (thenableOrResult?: E[] | PromiseLike<E[]>) => void;
    private rejectAll: (error?: any) => void;
    private resolvingCount: number = 0;
    private currentIndex: number = 0;

    constructor(depth: number, loadGenerator: LoadGenerator<E>) {
        assertPositive(depth, 'depth should be positive');
        this.depth = depth;
        this.loadGenerator = loadGenerator;
    }

    startLoad(): Promise<E[]> {
        return new Promise<E[]>((resolve, reject) => {
            this.resolveAll = resolve;
            this.rejectAll = reject;

            for (let i = 0; i < this.depth; i++) {
                this.next();
                if (this.done) {
                    break;
                }
            }
        });
    }

    private next(): void {
        if (this.rejected) {
            return;
        }

        const p = this.loadGenerator.doCommand();
        const i = this.currentIndex++;

        if (p == null) {
            this.done = true;
            if (this.resolvingCount === 0) {
                this.resolveAll(this.results);
            }
            return;
        }

        this.resolvingCount++;

        p.then((value) => {
           this.results[i] = value;
           this.resolvingCount--;
           this.next();
        }).catch((err) => {
            this.rejected = true;
            this.rejectAll(err);
        });
    }
}
