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
exports.TopicOverloadPolicy = void 0;
/**
 * Overload policy for Reliable Topic.
 */
var TopicOverloadPolicy;
(function (TopicOverloadPolicy) {
    /**
     * Using this policy, a message that has not expired can be overwritten.
     * No matter the retention period set, the overwrite will just overwrite the item.
     *
     * This can be a problem for slow consumers because they were promised a certain time window to process messages.
     * However, it will benefit producers and fast consumers since they are able to continue.
     * This policy sacrifices the slow producer in favor of fast producers/consumers.
     */
    TopicOverloadPolicy["DISCARD_OLDEST"] = "DISCARD_OLDEST";
    /**
     * The message that was to be published, is discarded.
     */
    TopicOverloadPolicy["DISCARD_NEWEST"] = "DISCARD_NEWEST";
    /**
     * The caller will wait till there space in the ringbuffer.
     */
    TopicOverloadPolicy["BLOCK"] = "BLOCK";
    /**
     * The publish call immediately fails.
     */
    TopicOverloadPolicy["ERROR"] = "ERROR";
})(TopicOverloadPolicy = exports.TopicOverloadPolicy || (exports.TopicOverloadPolicy = {}));
//# sourceMappingURL=TopicOverloadPolicy.js.map