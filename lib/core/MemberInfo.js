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
exports.lookupPublicAddress = exports.MemberInfo = void 0;
const EndpointQualifier_1 = require("./EndpointQualifier");
/** @internal */
class MemberInfo {
    constructor(address, uuid, attributes, liteMember, version, isAddressMapExists, addressMap) {
        this.address = address;
        this.uuid = uuid;
        this.attributes = attributes;
        this.liteMember = liteMember;
        this.version = version;
        if (isAddressMapExists) {
            this.addressMap = addressMap;
        }
        else {
            this.addressMap = new Map();
        }
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        if (!this.address.equals(other.address)) {
            return false;
        }
        return this.uuid != null ? this.uuid.equals(other.uuid) : other.uuid === null;
    }
    toString() {
        return 'Member[uuid: ' + this.uuid.toString()
            + ', address: ' + this.address.toString()
            + ', liteMember: ' + this.liteMember
            + ', memberListJoinVersion' + this.version + ']';
    }
}
exports.MemberInfo = MemberInfo;
/**
 * Looks up client public address for the given member.
 *
 * @returns found address or `null`
 * @internal
 */
function lookupPublicAddress(member) {
    for (const [qualifier, address] of member.addressMap.entries()) {
        if (qualifier.type === EndpointQualifier_1.ProtocolType.CLIENT && qualifier.identifier === 'public') {
            return address;
        }
    }
    return null;
}
exports.lookupPublicAddress = lookupPublicAddress;
//# sourceMappingURL=MemberInfo.js.map