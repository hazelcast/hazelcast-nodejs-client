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

const AddressHelper = require('../../lib/Util').AddressHelper;
const expect = require('chai').expect;

describe('AddressHelper', function () {
    const v4Address = '127.0.0.1';
    const v6Address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const port = 8080;
    const defaultPort = 5701;

    it('should return a single address when the port is specified', function () {
        const addresses = AddressHelper.getSocketAddresses(`${v4Address}:${port}`);
        expect(addresses.length).to.equal(1);

        const address = addresses[0];
        expect(address.host).to.equal(v4Address);
        expect(address.port).to.equal(port);
    });

    it('should return multiple addresses when the port is not specified', function () {
        const addresses = AddressHelper.getSocketAddresses(`${v4Address}`);
        expect(addresses.length).to.equal(3);

        for (let i = 0; i < 3; i++) {
            expect(addresses[i].host).to.equal(v4Address);
            expect(addresses[i].port).to.equal(defaultPort + i);
        }
    });

    it('should return a single address when the port is specified with IPv6 address', function () {
        const addresses = AddressHelper.getSocketAddresses(`[${v6Address}]:${port}`);
        expect(addresses.length).to.equal(1);

        const address = addresses[0];
        expect(address.host).to.equal(v6Address);
        expect(address.port).to.equal(port);
    });

    it('should return multiple addresses when the port is not specified with IPv6 address', function () {
        const addresses = AddressHelper.getSocketAddresses(v6Address);
        expect(addresses.length).to.equal(3);

        for (let i = 0; i < 3; i++) {
            expect(addresses[i].host).to.equal(v6Address);
            expect(addresses[i].port).to.equal(defaultPort + i);
        }
    });
});
