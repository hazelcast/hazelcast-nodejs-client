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
chai.should();
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const net = require('net');

const { HazelcastError } = require('../../../lib/core');
const { AddressImpl } = require('../../../lib/core/Address');
const { HazelcastCloudDiscovery } = require('../../../lib/discovery/HazelcastCloudDiscovery');

describe('HazelcastCloudDiscoveryTest', function () {

    let server;

    async function startUnresponsiveServer(port) {
        server = net.createServer(() => {
            // no-response
        });
        await new Promise((resolve) => server.listen(port, resolve));
    }

    function stopUnresponsiveServer() {
        if (server !== null) {
            server.close();
        }
    }

    afterEach(function () {
        stopUnresponsiveServer();
    });

    it('should parse response', function () {
        const discovery = new HazelcastCloudDiscovery();

        const response = '[{"private-address":"100.96.5.1","public-address":"10.113.44.139:31115"},'
            + '{"private-address":"100.96.4.2","public-address":"10.113.44.130:31115"}]';

        const privateToPublicAddresses = discovery.parseResponse(response);

        expect(privateToPublicAddresses.size).to.equal(2);
        expect(new AddressImpl('10.113.44.139', 31115))
            .to.deep.equal(privateToPublicAddresses.get(new AddressImpl('100.96.5.1', 31115).toString()));
        expect(new AddressImpl('10.113.44.130', 31115))
            .to.deep.equal(privateToPublicAddresses.get(new AddressImpl('100.96.4.2', 31115).toString()));
    });

    it('should parse response with different port on private address', function () {
        const discovery = new HazelcastCloudDiscovery();

        const response = '[{"private-address":"100.96.5.1:5701","public-address":"10.113.44.139:31115"},'
            + '{"private-address":"100.96.4.2:5701","public-address":"10.113.44.130:31115"}]';

        const privateToPublicAddresses = discovery.parseResponse(response);

        expect(privateToPublicAddresses.size).to.equal(2);
        expect(new AddressImpl('10.113.44.139', 31115))
            .to.deep.equal(privateToPublicAddresses.get(new AddressImpl('100.96.5.1', 5701).toString()));
        expect(new AddressImpl('10.113.44.130', 31115))
            .to.deep.equal(privateToPublicAddresses.get(new AddressImpl('100.96.4.2', 5701).toString()));
    });

    it('should cancel request on timeout', async function () {
        await startUnresponsiveServer(9999);

        const connectionTimeoutMs = 100;
        const discovery = new HazelcastCloudDiscovery('https://localhost:9999', connectionTimeoutMs);

        await expect(discovery.discoverNodes()).to.be.rejectedWith(HazelcastError);
    });
});
