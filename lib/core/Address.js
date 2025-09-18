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
exports.Addresses = exports.AddressImpl = void 0;
const net = require("net");
const ClusterDataFactory_1 = require("../serialization/ClusterDataFactory");
/** @internal */
class AddressImpl {
    constructor(host, port) {
        this.factoryId = ClusterDataFactory_1.CLUSTER_DATA_FACTORY_ID;
        this.classId = ClusterDataFactory_1.CLUSTER_DATA_ADDRESS_CLASS_ID;
        this.host = host;
        this.port = port;
        this.type = net.isIP(host);
        this.addrStr = this.toStringInternal();
    }
    readData(input) {
        this.port = input.readInt();
        this.type = input.readByte();
        this.host = input.readString();
        this.addrStr = this.toStringInternal();
    }
    writeData(output) {
        output.writeInt(this.port);
        output.writeByte(this.type);
        output.writeString(this.host);
    }
    equals(other) {
        if (other === this) {
            return true;
        }
        if (other == null) {
            return false;
        }
        return other.host === this.host &&
            other.port === this.port &&
            other.type === this.type;
    }
    toString() {
        return this.addrStr;
    }
    toStringInternal() {
        return this.host + ':' + this.port;
    }
}
exports.AddressImpl = AddressImpl;
/**
 * A collection of addresses. It is split in a group of primary
 * addresses (so the ones that should be tried first), and a group
 * of secondary addresses (addresses that should be tried when the
 * primary group of addresses could not be connected to).
 * @internal
*/
class Addresses {
    constructor(primary, secondary) {
        if (primary) {
            this.primary = primary;
        }
        else {
            this.primary = [];
        }
        if (secondary) {
            this.secondary = secondary;
        }
        else {
            this.secondary = [];
        }
    }
    addAll(addresses) {
        addresses.primary.forEach((addr) => this.primary.push(addr));
        addresses.secondary.forEach((addr) => this.secondary.push(addr));
    }
}
exports.Addresses = Addresses;
//# sourceMappingURL=Address.js.map