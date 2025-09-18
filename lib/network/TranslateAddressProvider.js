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
exports.TranslateAddressProvider = void 0;
const MemberInfo_1 = require("../core/MemberInfo");
const DefaultAddressProvider_1 = require("../connection/DefaultAddressProvider");
const Util_1 = require("../util/Util");
const AddressUtil_1 = require("../util/AddressUtil");
const PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED = 'hazelcast.discovery.public.ip.enabled';
const REACHABLE_CHECK_LIMIT = 3;
/**
 * Determines if the client should use an internal or public member address.
 * The public IP enabled property acts as a tri-state boolean. When set to
 * `true`, it makes the client to use public addresses. Setting it to `false`
 * makes the client to use internal addresses.
 *
 * If the property is not defined, this class tries to automatically detect
 * what to do. To do so, it executes the following steps:
 * 1. Check if internal member address is the same as defined in the client
 *    configuration (if it's the same, it means we can access members via their
 *    internal addresses, so no need to use public addresses); if not then
 * 2. Check if every member is reachable via public address but not reachable
 *    via internal address (for the performance reason, only 3 members are
 *    checked).
 * @internal
 */
class TranslateAddressProvider {
    constructor(config, logger) {
        this.internalAddressTimeoutMs = 1000;
        this.publicAddressTimeoutMs = 3000;
        this.translateToPublicAddress = false;
        this.config = config;
        this.publicIpEnabled = config.properties[PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED];
        this.logger = logger;
    }
    get() {
        return this.translateToPublicAddress;
    }
    refresh(addressProvider, members) {
        return this.resolve(addressProvider, members)
            .then((shouldTranslate) => {
            this.translateToPublicAddress = shouldTranslate;
        });
    }
    resolve(addressProvider, members) {
        if (!(addressProvider instanceof DefaultAddressProvider_1.DefaultAddressProvider)) {
            return Promise.resolve(false);
        }
        // Default value of the property is `null` intentionally. If it's not set
        // to `true`/`false`, we don't know the intention of the user, we will try
        // to decide if we should use private/public address automatically in that case.
        if (this.publicIpEnabled == null) {
            const sslConfig = this.config.network.ssl;
            if (sslConfig.enabled) {
                this.logger.debug('TranslateAddressProvider', 'SSL is configured. Client will use internal '
                    + 'addresses to communicate with the cluster. If members are not reachable via private '
                    + 'addresses, please set "' + PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED + '" property to true.');
                return Promise.resolve(false);
            }
            if (members.length === 0) {
                return Promise.resolve(false);
            }
            return this.internalMemberAddressMatchesConfig(members)
                .then((addressMatchConfig) => {
                if (addressMatchConfig) {
                    return false;
                }
                return this.reachableOnlyViaPublicAddress(members);
            });
        }
        return Promise.resolve(this.publicIpEnabled);
    }
    /**
     * Checks if any member has its internal address as configured in client config.
     *
     * If any member has its internal/private address the same as configured in client config,
     * then it means that the client is able to connect to members via configured address.
     * No need to use make any address translation.
     *
     * Hosts are resolved to IP addresses before doing the check to have correct behavior
     * when members/clients are configured differently (addresses/host names).
     */
    internalMemberAddressMatchesConfig(members) {
        const pHostsFromConfig = this.config.network.clusterMembers
            .map((address) => {
            return (0, AddressUtil_1.resolveAddress)(address).catch(() => null);
        });
        let addressesFromConfig;
        return Promise.all(pHostsFromConfig)
            .then((addresses) => {
            addressesFromConfig = addresses;
            const memberHostPromises = members
                .map((member) => {
                return (0, AddressUtil_1.resolveAddress)(member.address.host).catch(() => null);
            });
            return Promise.all(memberHostPromises);
        }).then((addressesFromMembers) => {
            for (const address of addressesFromMembers) {
                if (addressesFromConfig.includes(address)) {
                    return true;
                }
            }
            return false;
        });
    }
    /**
     * Checks if members are reachable via public addresses, but not reachable via internal addresses.
     *
     * We check only limited number of random members to reduce the slowdown of the startup.
     */
    reachableOnlyViaPublicAddress(members) {
        const shuffledMembers = members.slice();
        (0, Util_1.shuffleArray)(shuffledMembers);
        return this.reachableOnlyViaPublicAddressInternal(shuffledMembers, 1);
    }
    reachableOnlyViaPublicAddressInternal(shuffledMembers, attempt) {
        if (attempt >= REACHABLE_CHECK_LIMIT) {
            return Promise.resolve(true);
        }
        const member = shuffledMembers[0];
        const publicAddress = (0, MemberInfo_1.lookupPublicAddress)(member);
        if (publicAddress == null) {
            this.logger.debug('TranslateAddressProvider', 'Public address is not available '
                + 'on member ' + member.uuid.toString() + '. Client will use internal addresses.');
            return Promise.resolve(false);
        }
        const internalAddress = member.address;
        return Promise.all([
            (0, AddressUtil_1.isAddressReachable)(internalAddress.host, internalAddress.port, this.internalAddressTimeoutMs),
            (0, AddressUtil_1.isAddressReachable)(publicAddress.host, publicAddress.port, this.publicAddressTimeoutMs)
        ]).then(([internallyReachable, publiclyReachable]) => {
            if (internallyReachable) {
                this.logger.debug('TranslateAddressProvider', 'Internal address ' + internalAddress.toString()
                    + ' is reachable. Client will use the internal addresses.');
                return false;
            }
            if (!publiclyReachable) {
                this.logger.debug('TranslateAddressProvider', 'Public address ' + publicAddress.toString()
                    + ' is not reachable. Client will use the internal addresses.');
                return false;
            }
            if (shuffledMembers.length > 1) {
                // iterate with the next member
                shuffledMembers.splice(0, 1);
            }
            return this.reachableOnlyViaPublicAddressInternal(shuffledMembers, ++attempt);
        });
    }
}
exports.TranslateAddressProvider = TranslateAddressProvider;
//# sourceMappingURL=TranslateAddressProvider.js.map