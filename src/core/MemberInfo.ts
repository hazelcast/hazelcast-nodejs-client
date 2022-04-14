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
/** @ignore *//** */

import {AddressImpl} from './Address';
import {UUID} from './UUID';
import {MemberImpl} from './Member';
import {MemberVersion} from './MemberVersion';
import {EndpointQualifier, ProtocolType} from './EndpointQualifier';

/** @internal */
export class MemberInfo {

    readonly address: AddressImpl;
    readonly uuid: UUID;
    readonly liteMember: boolean;
    readonly attributes: Map<string, string>;
    readonly version: MemberVersion;
    readonly addressMap: Map<EndpointQualifier, AddressImpl>;

    constructor(address: AddressImpl,
                uuid: UUID,
                attributes: Map<string, string>,
                liteMember: boolean,
                version: MemberVersion,
                isAddressMapExists: boolean,
                addressMap: Map<EndpointQualifier, AddressImpl>) {
        this.address = address;
        this.uuid = uuid;
        this.attributes = attributes;
        this.liteMember = liteMember;
        this.version = version;
        if (isAddressMapExists) {
            this.addressMap = addressMap;
        } else {
            this.addressMap = new Map();
        }
    }

    equals(other: MemberInfo): boolean {
        if (other == null) {
            return false;
        }
        if (!this.address.equals(other.address)) {
            return false;
        }
        return this.uuid != null ? this.uuid.equals(other.uuid) : other.uuid === null;
    }

    toString(): string {
        return 'Member[uuid: ' + this.uuid.toString()
            + ', address: ' + this.address.toString()
            + ', liteMember: ' + this.liteMember
            + ', memberListJoinVersion' + this.version + ']';
    }
}

/**
 * Looks up client public address for the given member.
 *
 * @returns found address or `null`
 * @internal
 */
export function lookupPublicAddress(member: MemberInfo | MemberImpl): AddressImpl {
    for (const [qualifier, address] of member.addressMap.entries()) {
        if (qualifier.type === ProtocolType.CLIENT && qualifier.identifier === 'public') {
            return address;
        }
    }
    return null;
}
