/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {HazelcastCloudDiscovery} from './HazelcastCloudDiscovery';
import {LoggingService} from '../logging/LoggingService';
import {AddressTranslator} from '../connection/AddressTranslator';
import * as Promise from 'bluebird';
import Address = require('../Address');

export class HazelcastCloudAddressTranslator implements AddressTranslator {
    private loggingService: LoggingService;
    private readonly hazelcastCloudDiscovery: HazelcastCloudDiscovery;

    private privateToPublic: Map<string, Address> = new Map<string, Address>();

    constructor(endpointUrl: string, connectionTimeoutMillis: number, loggingService: LoggingService) {
        this.hazelcastCloudDiscovery = new HazelcastCloudDiscovery(endpointUrl, connectionTimeoutMillis);
        this.loggingService = loggingService;
    }

    translate(address: Address): Promise<Address> {
        if (address == null) {
            return Promise.resolve(null);
        }
        const publicAddress = this.privateToPublic.get(address.toString());
        if (publicAddress != null) {
            return Promise.resolve(publicAddress);
        }

        return this.refresh().then(() => {
            if (this.privateToPublic.get(address.toString())) {
                return this.privateToPublic.get(address.toString());
            } else {
                return null;
            }
        });
    }

    refresh(): Promise<void> {
        return this.hazelcastCloudDiscovery.discoverNodes().then((res) => {
            this.privateToPublic = res;
        }).catch((e) => {
            this.loggingService.warn('HazelcastCloudAddressTranslator',
                'Failed to load addresses from hazelcast.cloud : ' + e.message);
        });
    }
}
