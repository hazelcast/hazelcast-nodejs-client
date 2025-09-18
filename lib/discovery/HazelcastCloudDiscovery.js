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
exports.HazelcastCloudDiscovery = void 0;
const Util_1 = require("../util/Util");
const AddressUtil_1 = require("../util/AddressUtil");
const https_1 = require("https");
const URL = require("url");
const core_1 = require("../core");
/**
 * Discovery service that discovers nodes via hazelcast.cloud
 * https://api.cloud.hazelcast.com/cluster/discovery?token=<TOKEN>
 * @internal
 */
class HazelcastCloudDiscovery {
    constructor(endpointUrl, connectionTimeoutMillis) {
        this.endpointUrl = endpointUrl;
        this.connectionTimeoutMillis = connectionTimeoutMillis;
    }
    static createUrlEndpoint(properties, cloudToken) {
        const cloudBaseUrl = properties[HazelcastCloudDiscovery.CLOUD_URL_BASE_PROPERTY];
        return cloudBaseUrl + this.CLOUD_URL_PATH + cloudToken;
    }
    discoverNodes() {
        return this.callService();
    }
    callService() {
        const deferred = (0, Util_1.deferredPromise)();
        const url = URL.parse(this.endpointUrl);
        const endpointUrlOptions = {
            host: url.hostname,
            path: url.path,
            timeout: this.connectionTimeoutMillis
        };
        // non-default port is used in tests
        if (url.port != null) {
            endpointUrlOptions.port = url.port;
        }
        let dataAsAString = '';
        const req = (0, https_1.get)(endpointUrlOptions, (res) => {
            if (res.statusCode != 200) {
                deferred.reject(new core_1.HazelcastError('Your cluster discovery token is invalid.'));
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
            req.destroy(new core_1.HazelcastError('Hazelcast Cloud request timed out'));
        });
        return deferred.promise;
    }
    static parseResponse(data) {
        const jsonValue = JSON.parse(data);
        const privateToPublicAddresses = new Map();
        for (const value of jsonValue) {
            const privateAddress = value[HazelcastCloudDiscovery.PRIVATE_ADDRESS_PROPERTY];
            const publicAddress = value[HazelcastCloudDiscovery.PUBLIC_ADDRESS_PROPERTY];
            const publicAddr = (0, AddressUtil_1.createAddressFromString)(publicAddress.toString());
            // If not explicitly given, create the private address with the public addresses port
            const privateAddr = (0, AddressUtil_1.createAddressFromString)(privateAddress.toString(), publicAddr.port);
            privateToPublicAddresses.set(privateAddr.toString(), publicAddr);
        }
        return privateToPublicAddresses;
    }
}
exports.HazelcastCloudDiscovery = HazelcastCloudDiscovery;
/**
 * Internal client property to change base url of cloud discovery endpoint.
 * Used for testing cloud discovery.
 */
HazelcastCloudDiscovery.CLOUD_URL_BASE_PROPERTY = 'hazelcast.client.cloud.url';
HazelcastCloudDiscovery.CLOUD_URL_PATH = '/cluster/discovery?token=';
HazelcastCloudDiscovery.PRIVATE_ADDRESS_PROPERTY = 'private-address';
HazelcastCloudDiscovery.PUBLIC_ADDRESS_PROPERTY = 'public-address';
//# sourceMappingURL=HazelcastCloudDiscovery.js.map