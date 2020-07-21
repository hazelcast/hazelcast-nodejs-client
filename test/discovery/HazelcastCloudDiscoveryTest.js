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
'use strict';

const expect = require('chai').expect;
const Address = require('../../lib/Address').Address;
const HazelcastCloudDiscovery = require('../../lib/discovery/HazelcastCloudDiscovery').HazelcastCloudDiscovery;

describe('HazelcastCloudDiscoveryTest', function () {

    const hazelcastCloudDiscovery = new HazelcastCloudDiscovery();

    it('should parse response', function () {
        const response = '[{"private-address":"100.96.5.1","public-address":"10.113.44.139:31115"},'
            + '{"private-address":"100.96.4.2","public-address":"10.113.44.130:31115"}]';

        const privateToPublicAddresses = hazelcastCloudDiscovery.parseResponse(response);

        expect(privateToPublicAddresses.size).to.equal(2);
        expect(new Address('10.113.44.139', 31115))
            .to.deep.equal(privateToPublicAddresses.get(new Address('100.96.5.1', 31115).toString()));
        expect(new Address('10.113.44.130', 31115))
            .to.deep.equal(privateToPublicAddresses.get(new Address('100.96.4.2', 31115).toString()));
    });

    it('should parse response with different port on private address', function () {
        const response = '[{"private-address":"100.96.5.1:5701","public-address":"10.113.44.139:31115"},'
            + '{"private-address":"100.96.4.2:5701","public-address":"10.113.44.130:31115"}]';

        const privateToPublicAddresses = hazelcastCloudDiscovery.parseResponse(response);

        expect(privateToPublicAddresses.size).to.equal(2);
        expect(new Address('10.113.44.139', 31115))
            .to.deep.equal(privateToPublicAddresses.get(new Address('100.96.5.1', 5701).toString()));
        expect(new Address('10.113.44.130', 31115))
            .to.deep.equal(privateToPublicAddresses.get(new Address('100.96.4.2', 5701).toString()));
    });
});
