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
exports.LockReferenceIdGenerator = void 0;
const Long = require("long");
/** @internal */
class LockReferenceIdGenerator {
    constructor() {
        this.counter = Long.fromNumber(0);
    }
    getNextReferenceId() {
        this.counter = this.counter.add(1);
        return this.counter;
    }
}
exports.LockReferenceIdGenerator = LockReferenceIdGenerator;
//# sourceMappingURL=LockReferenceIdGenerator.js.map