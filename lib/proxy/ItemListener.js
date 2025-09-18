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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemEventType = exports.ItemEvent = void 0;
/**
 * IQueue, ISet, IList item event.
 */
class ItemEvent {
    /** @internal */
    constructor(name, eventType, item, member) {
        this.name = name;
        this.eventType = eventType;
        this.item = item;
        this.member = member;
    }
}
exports.ItemEvent = ItemEvent;
/** @internal */
var ItemEventType;
(function (ItemEventType) {
    ItemEventType[ItemEventType["ADDED"] = 1] = "ADDED";
    ItemEventType[ItemEventType["REMOVED"] = 2] = "REMOVED";
})(ItemEventType = exports.ItemEventType || (exports.ItemEventType = {}));
//# sourceMappingURL=ItemListener.js.map