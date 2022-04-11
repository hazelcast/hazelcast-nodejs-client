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
'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { DefaultAddressProvider } = require('../../../lib/connection/DefaultAddressProvider');
const { ClientNetworkConfigImpl } = require('../../../lib/config/ClientNetworkConfig');

describe('DefaultAddressProviderTest', function () {
    function addressProvider(...clusterMembers) {
        const networkConfig = new ClientNetworkConfigImpl();
        if (clusterMembers) {
            networkConfig.clusterMembers = clusterMembers;
        }
        return new DefaultAddressProvider(networkConfig);
    }

    function assertPrimary(addresses, ...expected) {
        const primary = addresses.primary.map((addr) => addr.toString());
        expect(primary).to.have.all.ordered.members(expected);
    }

    function assertSecondary(addresses, ...expected) {
        const secondary = addresses.secondary.map((addr) => addr.toString());
        expect(secondary).to.have.all.ordered.members(expected);
    }

    afterEach(function () {
        sandbox.restore();
    });

    it('loadAddresses: should load 127.0.0.1:5701-5703 for default config', async function () {
        const provider = addressProvider();

        const addresses = await provider.loadAddresses();

        assertPrimary(addresses, '127.0.0.1:5701');
        assertSecondary(addresses, '127.0.0.1:5702', '127.0.0.1:5703');
    });

    it('loadAddresses: should load address:5701-5703 for config with address only', async function () {
        const provider = addressProvider('192.168.0.1');

        const addresses = await provider.loadAddresses();

        assertPrimary(addresses, '192.168.0.1:5701');
        assertSecondary(addresses, '192.168.0.1:5702', '192.168.0.1:5703');
    });

    it('loadAddresses: should load address:port for config with address and port', async function () {
        const provider = addressProvider('192.168.0.1:5705');

        const addresses = await provider.loadAddresses();

        assertPrimary(addresses, '192.168.0.1:5705');
        expect(addresses.secondary).to.have.lengthOf(0);
    });

    it('loadAddresses: should load correct addresses for mixed config', async function () {
        const provider = addressProvider('192.168.0.1:5705', 'example.com');

        const addresses = await provider.loadAddresses();

        assertPrimary(addresses, '192.168.0.1:5705', 'example.com:5701');
        assertSecondary(addresses, 'example.com:5702', 'example.com:5703');
    });
});
