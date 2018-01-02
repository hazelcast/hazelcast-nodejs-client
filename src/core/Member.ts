/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

import Address = require('../Address');
import {UUID} from './UUID';
export class Member {
    /**
     * Network address of member.
     */
    address: Address;
    /**
     * Unique id of member in cluster.
     */
    uuid: string;
    /**
     * true if member is a lite member.
     */
    isLiteMember: boolean;
    attributes: {[id: string]: string};

    constructor(address: Address, uuid: string, isLiteMember = false, attributes: {[id: string]: string} = {}) {
        this.address = address;
        this.uuid = uuid;
        this.isLiteMember = isLiteMember;
        this.attributes = attributes;
    }

    equals(other: Member): boolean {
        if (other === this) {
            return true;
        }
        if (other == null) {
            return false;
        }
        if (other.address.equals(this.address) && other.uuid === this.uuid && other.isLiteMember === this.isLiteMember) {
            return true;
        }
        return false;
    }

    toString() {
        return 'Member[ uuid: ' + this.uuid.toString() + ', address: ' + this.address.toString() + ']';
    }
}
