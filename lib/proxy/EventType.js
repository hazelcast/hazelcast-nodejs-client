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
exports.EventType = void 0;
/** @internal */
var EventType;
(function (EventType) {
    EventType[EventType["ADDED"] = 1] = "ADDED";
    EventType[EventType["REMOVED"] = 2] = "REMOVED";
    EventType[EventType["UPDATED"] = 4] = "UPDATED";
    EventType[EventType["EVICTED"] = 8] = "EVICTED";
    EventType[EventType["EXPIRED"] = 16] = "EXPIRED";
    EventType[EventType["EVICT_ALL"] = 32] = "EVICT_ALL";
    EventType[EventType["CLEAR_ALL"] = 64] = "CLEAR_ALL";
    EventType[EventType["MERGED"] = 128] = "MERGED";
    EventType[EventType["INVALIDATION"] = 256] = "INVALIDATION";
    EventType[EventType["LOADED"] = 512] = "LOADED";
})(EventType = exports.EventType || (exports.EventType = {}));
//# sourceMappingURL=EventType.js.map