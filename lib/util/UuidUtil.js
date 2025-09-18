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
exports.UuidUtil = void 0;
const Long = require("long");
const UUID_1 = require("../core/UUID");
const INT_BOUND = 0xFFFFFFFF;
function randomUInt() {
    return Math.floor(Math.random() * INT_BOUND);
}
/** @internal */
class UuidUtil {
    static generate(isUnsigned = true) {
        const mostS = new Long(randomUInt(), randomUInt(), isUnsigned);
        const leastS = new Long(randomUInt(), randomUInt(), isUnsigned);
        return new UUID_1.UUID(mostS, leastS);
    }
    static convertUUIDSetToStringSet(uuidSet) {
        const result = new Set();
        for (const uuid of uuidSet) {
            result.add(uuid.toString());
        }
        return result;
    }
}
exports.UuidUtil = UuidUtil;
//# sourceMappingURL=UuidUtil.js.map