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
exports.DefaultAddressProvider = void 0;
const Address_1 = require("../core/Address");
const AddressUtil_1 = require("../util/AddressUtil");
/**
 * Default address provider of Hazelcast.
 * Loads addresses from the Hazelcast configuration.
 * @internal
 */
class DefaultAddressProvider {
    constructor(networkConfig) {
        this.networkConfig = networkConfig;
    }
    loadAddresses() {
        const addressList = this.networkConfig.clusterMembers;
        if (addressList.length === 0) {
            addressList.push('127.0.0.1');
        }
        const addresses = new Address_1.Addresses();
        for (const address of addressList) {
            addresses.addAll((0, AddressUtil_1.getSocketAddresses)(address));
        }
        return Promise.resolve(addresses);
    }
    translate(address) {
        return Promise.resolve(address);
    }
}
exports.DefaultAddressProvider = DefaultAddressProvider;
//# sourceMappingURL=DefaultAddressProvider.js.map