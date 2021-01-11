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

import * as net from 'net';
import {
    CLUSTER_DATA_FACTORY_ID,
    CLUSTER_DATA_ADDRESS_CLASS_ID
} from '../serialization/ClusterDataFactory';
import {DataInput, DataOutput} from '../serialization/Data';
import {IdentifiedDataSerializable} from '../serialization/Serializable';

/**
 * Represents a network address (e.g. of the client or a cluster member).
 */
export interface Address {

    /**
     * Host name or IP address.
     */
    host: string;

    /**
     * Port number.
     */
    port: number;

    /**
     * Returns string representation of the address.
     */
    toString(): string;

}

/** @internal */
export class AddressImpl implements Address, IdentifiedDataSerializable {

    factoryId = CLUSTER_DATA_FACTORY_ID;
    classId = CLUSTER_DATA_ADDRESS_CLASS_ID;
    host: string;
    port: number;
    type: number;
    // memoization for toString()
    private addrStr: string;

    constructor(host?: string, port?: number) {
        this.host = host;
        this.port = port;
        this.type = net.isIP(host);
        this.addrStr = this.toStringInternal();
    }

    readData(input: DataInput): any {
        this.port = input.readInt();
        this.type = input.readByte();
        this.host = input.readUTF();
        this.addrStr = this.toStringInternal();
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.port);
        output.writeByte(this.type);
        output.writeUTF(this.host);
    }

    equals(other: AddressImpl): boolean {
        if (other === this) {
            return true;
        }
        if (other == null) {
            return false;
        }
        if (other.host === this.host &&
            other.port === this.port &&
            other.type === this.type) {
            return true;
        }
        return false;
    }

    toString(): string {
        return this.addrStr;
    }

    private toStringInternal(): string {
        return this.host + ':' + this.port;
    }
}

/**
 * A collection of addresses. It is split in a group of primary
 * addresses (so the ones that should be tried first) and a group
 * of secondary addresses (addresses that should be tried when the
 * primary group of addresses could not be connected to).
 * @internal
*/
export class Addresses {

    readonly primary: AddressImpl[];
    readonly secondary: AddressImpl[];

    constructor(primary?: AddressImpl[], secondary?: AddressImpl[]) {
        if (primary) {
            this.primary = primary;
        } else {
            this.primary = [];
        }
        if (secondary) {
            this.secondary = secondary;
        } else {
            this.secondary = [];
        }
    }

    addAll(addresses: Addresses) {
        addresses.primary.forEach((addr) => this.primary.push(addr));
        addresses.secondary.forEach((addr) => this.secondary.push(addr));
    }
}
