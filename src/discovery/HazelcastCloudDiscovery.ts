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
/** @ignore *//** */

import {deferredPromise} from '../util/Util';
import {createAddressFromString} from '../util/AddressUtil';
import {get, RequestOptions} from 'https';
import {IncomingMessage} from 'http';
import {Properties} from '../config/Properties';
import * as URL from 'url';
import {AddressImpl} from '../core/Address';
import {HazelcastError} from '../core';

/**
 * Discovery service that discovers nodes via hazelcast.cloud
 * https://coordinator.hazelcast.cloud/cluster/discovery?token=<TOKEN>
 * @internal
 */
export class HazelcastCloudDiscovery {

    /**
     * Internal client property to change base url of cloud discovery endpoint.
     * Used for testing cloud discovery.
     */
    private static readonly CLOUD_URL_BASE_PROPERTY = 'hazelcast.client.cloud.url';
    private static readonly CLOUD_URL_PATH = '/cluster/discovery?token=';
    private static readonly PRIVATE_ADDRESS_PROPERTY = 'private-address';
    private static readonly PUBLIC_ADDRESS_PROPERTY = 'public-address';

    private readonly endpointUrl: string;
    private readonly connectionTimeoutMillis: number;

    constructor(endpointUrl: string, connectionTimeoutMillis: number) {
        this.endpointUrl = endpointUrl;
        this.connectionTimeoutMillis = connectionTimeoutMillis;
    }

    public static createUrlEndpoint(properties: Properties, cloudToken: string): string {
        const cloudBaseUrl = properties[HazelcastCloudDiscovery.CLOUD_URL_BASE_PROPERTY] as string;
        return cloudBaseUrl + this.CLOUD_URL_PATH + cloudToken;
    }

    discoverNodes(): Promise<Map<string, AddressImpl>> {
        return this.callService();
    }

    callService(): Promise<Map<string, AddressImpl>> {
        const deferred = deferredPromise<Map<string, AddressImpl>>();

        const url = URL.parse(this.endpointUrl);
        const endpointUrlOptions: RequestOptions = {
            host: url.hostname,
            path: url.path,
            timeout: this.connectionTimeoutMillis
        };
        // non-default port is used in tests
        if (url.port != null) {
            endpointUrlOptions.port = url.port;
        }

        let dataAsAString = '';
        const req = get(endpointUrlOptions, (res: IncomingMessage) => {
            if(res.statusCode != 200){
                deferred.reject(new HazelcastError('Your cluster discovery token is invalid.'));
                return;
            }
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                dataAsAString += chunk;
            });
            res.on('end', () => {
                deferred.resolve(HazelcastCloudDiscovery.parseResponse(dataAsAString));
            });
        });

        req.on('error', (err) => {
            deferred.reject(err);
        });
        req.on('timeout', () => {
            req.destroy(new HazelcastError('Hazelcast Cloud request timed out'));
        });

        return deferred.promise;
    }

    private static parseResponse(data: string): Map<string, AddressImpl> {
        const jsonValue = JSON.parse(data);

        const privateToPublicAddresses: Map<string, AddressImpl> = new Map<string, AddressImpl>();
        for (const value of jsonValue) {
            const privateAddress = value[HazelcastCloudDiscovery.PRIVATE_ADDRESS_PROPERTY];
            const publicAddress = value[HazelcastCloudDiscovery.PUBLIC_ADDRESS_PROPERTY];

            const publicAddr = createAddressFromString(publicAddress.toString());
            // If not explicitly given, create the private address with the public addresses port
            const privateAddr = createAddressFromString(privateAddress.toString(), publicAddr.port);
            privateToPublicAddresses.set(privateAddr.toString(), publicAddr);
        }

        return privateToPublicAddresses;
    }
}
