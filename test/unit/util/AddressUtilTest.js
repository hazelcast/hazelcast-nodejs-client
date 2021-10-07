/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const net = require('net');
const {
    createAddressFromString,
    getSocketAddresses,
    isAddressReachable,
    resolveAddress
} = require('../../../lib/util/AddressUtil');

describe('AddressUtilTest', function () {
    const host = 'example.com';
    const v4Address = '127.0.0.1';
    const v6Address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const port = 8080;
    const defaultPort = 5701;

    it('getSocketAddresses: should return a single address when the port is specified for IPv4', function () {
        const addresses = getSocketAddresses(`${v4Address}:${port}`);
        expect(addresses.primary).to.have.lengthOf(1);
        expect(addresses.secondary).to.have.lengthOf(0);

        const address = addresses.primary[0];
        expect(address.host).to.equal(v4Address);
        expect(address.port).to.equal(port);
    });

    it('getSocketAddresses: should return multiple addresses when the port is not specified for IPv4', function () {
        const addresses = getSocketAddresses(`${v4Address}`);
        expect(addresses.primary).to.have.lengthOf(1);
        expect(addresses.secondary).to.have.lengthOf(2);

        const primaryAddress = addresses.primary[0];
        expect(primaryAddress.host).to.equal(v4Address);
        expect(primaryAddress.port).to.equal(defaultPort);

        for (let i = 0; i < 2; i++) {
            expect(addresses.secondary[i].host).to.equal(v4Address);
            expect(addresses.secondary[i].port).to.equal(defaultPort + i + 1);
        }
    });

    it('getSocketAddresses: should return a single address when the port is specified for IPv6', function () {
        const addresses = getSocketAddresses(`[${v6Address}]:${port}`);
        expect(addresses.primary).to.have.lengthOf(1);
        expect(addresses.secondary).to.have.lengthOf(0);

        const address = addresses.primary[0];
        expect(address.host).to.equal(v6Address);
        expect(address.port).to.equal(port);
    });

    it('getSocketAddresses: should return multiple addresses when the port is not specified for IPv6', function () {
        const addresses = getSocketAddresses(v6Address);
        expect(addresses.primary).to.have.lengthOf(1);
        expect(addresses.secondary).to.have.lengthOf(2);

        const primaryAddress = addresses.primary[0];
        expect(primaryAddress.host).to.equal(v6Address);
        expect(primaryAddress.port).to.equal(defaultPort);

        for (let i = 0; i < 2; i++) {
            expect(addresses.secondary[i].host).to.equal(v6Address);
            expect(addresses.secondary[i].port).to.equal(defaultPort + i + 1);
        }
    });

    it('createAddressFromString: should return host address with port', function () {
        const address = createAddressFromString(`${host}:${port}`);

        expect(address.host).to.equal(host);
        expect(address.port).to.equal(port);
    });

    it('createAddressFromString: should return IPv4 address with port', function () {
        const address = createAddressFromString(`${v4Address}:${port}`);

        expect(address.host).to.equal(v4Address);
        expect(address.port).to.equal(port);
    });

    it('createAddressFromString: should return IPv6 address with port', function () {
        const address = createAddressFromString(`[${v6Address}]:${port}`);

        expect(address.host).to.equal(v6Address);
        expect(address.port).to.equal(port);
    });

    it('createAddressFromString: should return IPv6 address with brackets and port', function () {
        const address = createAddressFromString(`[${v6Address}]:${port}`);

        expect(address.host).to.equal(v6Address);
        expect(address.port).to.equal(port);
    });

    it('createAddressFromString: should use default port when not specified in address', function () {
        const address = createAddressFromString(v4Address, defaultPort);

        expect(address.host).to.equal(v4Address);
        expect(address.port).to.equal(defaultPort);
    });

    it('isAddressReachable: returns true for reachable address', async function () {
        const server = net.createServer(() => {
            // no-response
        });
        await new Promise((resolve) => server.listen(0, resolve));

        try {
            const result = await isAddressReachable('127.0.0.1', server.address().port, 1000);
            expect(result).to.be.true;
        } finally {
            server.close();
        }
    });

    it('isAddressReachable: returns true for reachable host', async function () {
        const server = net.createServer(() => {
            // no-response
        });
        await new Promise((resolve) => server.listen(0, resolve));

        try {
            const result = await isAddressReachable('localhost', server.address().port, 1000);
            expect(result).to.be.true;
        } finally {
            server.close();
        }
    });

    it('isAddressReachable: returns false for unreachable address', async function () {
        const result = await isAddressReachable('192.168.0.1', 5701, 100);
        expect(result).to.be.false;
    });

    it('resolveAddress: returns IPv4 for localhost with port', async function () {
        const result = await resolveAddress('localhost:5701');
        expect(result).to.be.equal('127.0.0.1');
    });

    it('resolveAddress: returns IPv4 for localhost without port', async function () {
        const result = await resolveAddress('localhost');
        expect(result).to.be.equal('127.0.0.1');
    });

    it('resolveAddress: returns IPv4 for IPv4 address with port', async function () {
        const result = await resolveAddress('127.0.0.1:5701');
        expect(result).to.be.equal('127.0.0.1');
    });

    it('resolveAddress: returns IPv6 for IPv6 address with port', async function () {
        const result = await resolveAddress('[0:0:0:0:0:0:0:1]:5701');
        expect(result).to.be.equal('0:0:0:0:0:0:0:1');
    });

    it('resolveAddress: rejects for invalid address', async function () {
        await expect(resolveAddress('...')).to.be.rejected;
    });

    it('resolveAddress: rejects for empty address', async function () {
        await expect(resolveAddress('')).to.be.rejected;
    });

    it('resolveAddress: rejects for null address', async function () {
        await expect(resolveAddress(null)).to.be.rejected;
    });
});
