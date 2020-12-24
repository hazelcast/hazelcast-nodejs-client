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

import {HazelcastCloudDiscovery} from './HazelcastCloudDiscovery';
import {AddressProvider} from '../connection/AddressProvider';
import {ILogger} from '../logging/ILogger';
import {AddressImpl, Addresses} from '../core/Address';
import {createAddressFromString} from '../util/AddressUtil';

/** @internal */
export class HazelcastCloudAddressProvider implements AddressProvider {

    private readonly logger: ILogger;
    private readonly cloudDiscovery: HazelcastCloudDiscovery;
    private privateToPublic: Map<string, AddressImpl> = new Map();

    constructor(endpointUrl: string, connectionTimeoutMillis: number, logger: ILogger) {
        this.cloudDiscovery = new HazelcastCloudDiscovery(endpointUrl, connectionTimeoutMillis);
        this.logger = logger;
    }

    loadAddresses(): Promise<Addresses> {
        return this.cloudDiscovery.discoverNodes()
            .then((res) => {
                this.privateToPublic = res;
                const addressList = Array.from(res.keys());
                const primary: AddressImpl[] = []
                for (const address of addressList) {
                    primary.push(createAddressFromString(address));
                }
                return new Addresses(primary);
            }).catch((e) => {
                this.logger.warn('HazelcastCloudAddressProvider',
                    'Failed to load addresses from Hazelcast Cloud: ' + e.message);
                return new Addresses();
            });
    }

    translate(address: AddressImpl): Promise<AddressImpl> {
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
                } else {
                    return null;
                }
            });
    }

    refresh(): Promise<void> {
        return this.cloudDiscovery.discoverNodes()
            .then((res) => {
                this.privateToPublic = res;
            }).catch((err) => {
                this.logger.warn('HazelcastCloudAddressProvider',
                    'Failed to load addresses from Hazelcast Cloud: ' + err.message);
            });
    }
}
