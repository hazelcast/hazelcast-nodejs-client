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
exports.RaftGroupId = void 0;
/** @internal */
class RaftGroupId {
    constructor(name, seed, id) {
        this.name = name;
        this.seed = seed;
        this.id = id;
    }
    getStringId() {
        if (this.stringId !== undefined) {
            return this.stringId;
        }
        this.stringId = this.name;
        this.stringId += ':' + this.seed.toString();
        this.stringId += ':' + this.id.toString();
        return this.stringId;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        if (this.name !== other.name) {
            return false;
        }
        if (!this.seed.equals(other.seed)) {
            return false;
        }
        return this.id.equals(other.id);
    }
}
exports.RaftGroupId = RaftGroupId;
//# sourceMappingURL=RaftGroupId.js.map