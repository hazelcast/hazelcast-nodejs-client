/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {Address, AddressImpl} from './Address';
import {UUID} from './UUID';
import {MemberVersion} from './MemberVersion';

export interface Member {

    /**
     * Network address of member.
     */
    address: Address;

    /**
     * Unique id of member in cluster.
     */
    uuid: UUID;

    /**
     * Lite member flag.
     */
    liteMember: boolean;

    /**
     * Returns string representation of this member.
     */
    toString(): string;

}

/** @internal */
export class MemberImpl implements Member {

    address: AddressImpl;
    uuid: UUID;
    liteMember: boolean;
    attributes: Map<string, string>;
    version: MemberVersion;

    constructor(address: AddressImpl,
                uuid: UUID,
                attributes: Map<string, string>,
                liteMember: boolean,
                version: MemberVersion) {
        this.address = address;
        this.uuid = uuid;
        this.attributes = attributes;
        this.liteMember = liteMember;
        this.version = version;
    }

    equals(other: MemberImpl): boolean {
        if (other == null) {
            return false;
        }
        if (!this.address.equals(other.address)) {
            return false;
        }
        return this.uuid != null ? this.uuid.equals(other.uuid) : other.uuid === null;
    }

    toString(): string {
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

    id(): string {
        let id = this.address.toString();
        if (this.uuid) {
            id += this.uuid.toString();
        }
        return id;
    }
}
