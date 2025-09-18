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
exports.HazelcastCloudAddressProvider = void 0;
const HazelcastCloudDiscovery_1 = require("./HazelcastCloudDiscovery");
const Address_1 = require("../core/Address");
const AddressUtil_1 = require("../util/AddressUtil");
/** @internal */
class HazelcastCloudAddressProvider {
    constructor(endpointUrl, connectionTimeoutMillis, logger) {
        this.privateToPublic = new Map();
        this.cloudDiscovery = new HazelcastCloudDiscovery_1.HazelcastCloudDiscovery(endpointUrl, connectionTimeoutMillis);
        this.logger = logger;
    }
    loadAddresses() {
        return this.cloudDiscovery.discoverNodes()
            .then((res) => {
            this.privateToPublic = res;
            const addressList = Array.from(res.keys());
            const primary = [];
            for (const address of addressList) {
                primary.push((0, AddressUtil_1.createAddressFromString)(address));
            }
            return new Address_1.Addresses(primary);
        }).catch((e) => {
            this.logger.warn('HazelcastCloudAddressProvider', 'Failed to load addresses from Hazelcast Cloud: ' + e.message);
            return new Address_1.Addresses();
        });
    }
    translate(address) {
        if (address == null) {
            return Promise.resolve(null);
        }
        let publicAddress = this.privateToPublic.get(address.toString());
        if (publicAddress != null) {
            return Promise.resolve(publicAddress);
        }
        return this.refresh()
            .then(() => {
            publicAddress = this.privateToPublic.get(address.toString());
            if (publicAddress != null) {
                return publicAddress;
            }
            else {
                return null;
            }
        });
    }
    refresh() {
        return this.cloudDiscovery.discoverNodes()
            .then((res) => {
            this.privateToPublic = res;
        }).catch((err) => {
            this.logger.warn('HazelcastCloudAddressProvider', 'Failed to load addresses from Hazelcast Cloud: ' + err.message);
        });
    }
}
exports.HazelcastCloudAddressProvider = HazelcastCloudAddressProvider;
//# sourceMappingURL=HazelcastCloudAddressProvider.js.map