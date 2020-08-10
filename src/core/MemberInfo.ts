/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {Address} from '../Address';
import {UUID} from './UUID';
import {MemberVersion} from './MemberVersion';

/** @internal */
export class MemberInfo {

    address: Address;
    uuid: UUID;
    liteMember: boolean;
    attributes: Map<string, string>;
    version: MemberVersion;

    constructor(address: Address,
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
