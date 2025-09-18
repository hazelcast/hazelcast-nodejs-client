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
exports.InitialMembershipEvent = exports.MemberEvent = exports.MembershipEvent = void 0;
/**
 * Membership event fired when a new member is added to the cluster and/or
 * when a member leaves the cluster or when there is a member attribute change.
 */
class MembershipEvent {
    /** @internal */
    constructor(member, eventType, members) {
        this.member = member;
        this.eventType = eventType;
        this.members = members;
    }
}
exports.MembershipEvent = MembershipEvent;
/** @internal */
var MemberEvent;
(function (MemberEvent) {
    MemberEvent[MemberEvent["ADDED"] = 1] = "ADDED";
    MemberEvent[MemberEvent["REMOVED"] = 2] = "REMOVED";
})(MemberEvent = exports.MemberEvent || (exports.MemberEvent = {}));
/**
 * An event that is sent when a {@link InitialMembershipListener} registers itself on a cluster.
 *
 * @see MembershipListener
 * @see MembershipEvent
 */
class InitialMembershipEvent {
    /** @internal */
    constructor(cluster, members) {
        this.cluster = cluster;
        this.members = members;
    }
}
exports.InitialMembershipEvent = InitialMembershipEvent;
//# sourceMappingURL=MembershipListener.js.map