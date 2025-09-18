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
exports.MemberImpl = void 0;
/** @internal */
class MemberImpl {
    constructor(address, uuid, attributes, liteMember, version, addressMap) {
        this.address = address;
        this.uuid = uuid;
        this.attributes = attributes;
        this.liteMember = liteMember;
        this.version = version;
        this.addressMap = addressMap;
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
        let memberStr = 'Member ['
            + this.address.host
            + ']:'
            + this.address.port
            + ' - '
            + this.uuid.toString();
        if (this.liteMember) {
            memberStr += ' lite';
        }
        return memberStr;
    }
    id() {
        let id = this.address.toString();
        if (this.uuid) {
            id += this.uuid.toString();
        }
        return id;
    }
}
exports.MemberImpl = MemberImpl;
//# sourceMappingURL=Member.js.map