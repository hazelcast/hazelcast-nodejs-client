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

import {ClientConfigImpl} from '../config';
import {AddressImpl} from '../core';
import {MemberInfo, lookupPublicAddress} from '../core/MemberInfo';
import {AddressProvider} from '../connection/AddressProvider';
import {DefaultAddressProvider} from '../connection/DefaultAddressProvider';
import {ILogger} from '../logging/ILogger';
import {shuffleArray} from '../util/Util';
import * as net from 'net';

const PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED = 'hazelcast.discovery.public.ip.enabled';
const REACHABLE_CHECK_LIMIT = 3;

/**
 * Determines if the client should use an internal or public member address.
 * The public IP enabled property acts as a tri-state boolean. When set to
 * `true` it makes the client to use public addresses. Setting it to `false`
 * makes the client to use internal addresses.
 *
 * If the property is not defined, this class tries to automatically detect
 * what to do. To do so it executes the following steps:
 * 1. Check if internal member address is the same as defined in the client
 *    configuration (if it's the same, it means we can access members via their
 *    internal addresses, so no need to use public addresses); if not then
 * 2. Check if every member is reachable via public address but not reachable
 *    via internal address (for the performance reason, only 3 members are
 *    checked).
 * @internal
 */
export class TranslateAddressProvider {

    private readonly config: ClientConfigImpl;
    private readonly publicIpEnabled: boolean;
    private readonly logger: ILogger;
    private readonly internalAddressTimeoutMs = 1000;
    private readonly publicAddressTimeoutMs = 3000;
    private translateToPublicAddress = false;

    constructor(config: ClientConfigImpl, logger: ILogger) {
        this.config = config;
        this.publicIpEnabled = config.properties[PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED] as boolean;
        this.logger = logger;
    }

    get(): boolean {
        return this.translateToPublicAddress;
    }

    refresh(addressProvider: AddressProvider, members: MemberInfo[]): Promise<void> {
        return this.resolve(addressProvider, members)
            .then((shouldTranslate) => {
                this.translateToPublicAddress = shouldTranslate;
            });
    }

    private resolve(addressProvider: AddressProvider, members: MemberInfo[]): Promise<boolean> {
        if (!(addressProvider instanceof DefaultAddressProvider)) {
            return Promise.resolve(false);
        }

        // Default value of the property is `undefined` intentionally. If it's not set
        // to `true`/`false`, we don't know the intention of the user, we will try
        // to decide if we should use private/public address automatically in that case.
        if (this.publicIpEnabled === undefined) {
            const sslConfig = this.config.network.ssl;
            if (sslConfig.enabled) {
                this.logger.debug('TranslateAddressProvider', 'SSL is configured. The client will '
                    + 'use internal addresses to communicate with the cluster. If members are not '
                    + 'reachable via private addresses, please set "'
                    + PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED + '" property to true');
                return Promise.resolve(false);
            }
            if (members.length === 0 || this.internalMemberAddressMatchesConfig(members)) {
                return Promise.resolve(false);
            }
            return this.reachableOnlyViaPublicAddress(members);
        }
        return Promise.resolve(this.publicIpEnabled);
    }

    /**
     * Checks if any member has its internal address as configured in client config.
     *
     * If any member has its internal/private address the same as configured in client config,
     * then it means that the client is able to connect to members via configured address.
     * No need to use make any address translation.
     */
    private internalMemberAddressMatchesConfig(members: MemberInfo[]): boolean {
        const addresses = this.config.network.clusterMembers;
        for (const member of members) {
            const memberAddress = member.address;
            if (addresses.includes(memberAddress.host)) {
                return true;
            }
            if (addresses.includes(memberAddress.toString())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if members are reachable via public addresses, but not reachable via internal addresses.
     *
     * We check only limited number of random members to reduce the slowdown of the startup.
     */
    private reachableOnlyViaPublicAddress(members: MemberInfo[]): Promise<boolean> {
        const shuffledMembers = members.slice();
        shuffleArray(shuffledMembers);
        return this.reachableOnlyViaPublicAddressInternal(shuffledMembers, 1);
    }

    private reachableOnlyViaPublicAddressInternal(shuffledMembers: MemberInfo[],
                                                  attempt: number): Promise<boolean> {
        if (attempt >= REACHABLE_CHECK_LIMIT) {
            return Promise.resolve(true);
        }
        const member = shuffledMembers[0];
        const publicAddress = lookupPublicAddress(member);
        if (publicAddress === undefined) {
            return Promise.resolve(false);
        }
        const internalAddress = member.address;
        return Promise.all([
            this.isReachable(internalAddress, this.internalAddressTimeoutMs),
            this.isReachable(publicAddress, this.publicAddressTimeoutMs)
        ]).then(([internallyReachable, publiclyReachable]) => {
            if (internallyReachable) {
                return false;
            }
            if (!publiclyReachable) {
                return false;
            }
            if (shuffledMembers.length > 1) {
                // iterate with the next member
                shuffledMembers.splice(0, 1);
            }
            return this.reachableOnlyViaPublicAddressInternal(shuffledMembers, ++attempt);
        });
    }

    private isReachable(address: AddressImpl, timeoutMs: number): Promise<boolean> {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(timeoutMs);
            const onError = (err: Error) => {
                socket.destroy();
                this.logger.debug('TranslateAddressProvider', 'Provider can not reach to address '
                    + address.toString() + ' in ' + timeoutMs + 'ms', err);
                resolve(false);
            };
            socket.once('error', onError);
            socket.once('timeout', onError);
            socket.connect(address.port, address.host, () => {
                socket.end();
                resolve(true);
            });
        });
    }
}
