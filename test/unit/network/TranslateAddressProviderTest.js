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

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const net = require('net');

const { AddressImpl } = require('../../../');
const { EndpointQualifier, ProtocolType } = require('../../../lib/core/EndpointQualifier');
const { TranslateAddressProvider } = require('../../../lib/network/TranslateAddressProvider');
const { ClientConfigImpl } = require('../../../lib/config/Config');
const { DefaultLogger } = require('../../../lib/logging/DefaultLogger');
const { DefaultAddressProvider } = require('../../../lib/connection/DefaultAddressProvider');
const { UuidUtil } = require('../../../lib/util/UuidUtil');

describe('TranslateAddressProviderTest', function () {

    const PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED = 'hazelcast.discovery.public.ip.enabled';
    const REACHABLE_HOST = '127.0.0.1';
    const UNREACHABLE_HOST = '192.168.0.1';

    let loggerStub;
    let fakeMemberServer;

    function translateAddressProvider(clientConfig, logger) {
        const provider = new TranslateAddressProvider(clientConfig, logger);
        provider.internalAddressTimeoutMs = 50;
        provider.publicAddressTimeoutMs = 150;
        return provider;
    }

    function clientConfig({ publicIpEnabled, memberAddresses } = {}) {
        const clientConfig = new ClientConfigImpl();
        if (publicIpEnabled !== undefined) {
            clientConfig.properties[PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED] = publicIpEnabled;
        }
        if (memberAddresses !== undefined) {
            clientConfig.network.clusterMembers = memberAddresses;
        }
        return clientConfig;
    }

    function defaultAddressProvider() {
        return new DefaultAddressProvider();
    }

    function nonDefaultAddressProvider() {
        return {};
    }

    function member({ internalHost, publicHost } = {}) {
        if (internalHost === undefined) {
            throw new Error('Internal host must be provided');
        }
        const member = {
            uuid: UuidUtil.generate(),
            address: new AddressImpl(internalHost, 5701),
            addressMap: new Map()
        };
        if (publicHost !== undefined) {
            member.addressMap.set(
                new EndpointQualifier(ProtocolType.CLIENT, 'public'),
                new AddressImpl(publicHost, 5701)
            );
        }
        return member;
    }

    beforeEach(async function () {
        fakeMemberServer = net.createServer(() => {
            // no-response
        });
        await new Promise((resolve) => fakeMemberServer.listen(5701, resolve));
        loggerStub = sandbox.stub(DefaultLogger.prototype);
    });

    afterEach(function () {
        sandbox.restore();
        fakeMemberServer.close();
    });

    it('should provide false before refresh for default config', function () {
        const provider = translateAddressProvider(clientConfig(), loggerStub);

        expect(provider.get()).to.be.false;
    });

    it('should provide false for property set to false', async function () {
        const provider = translateAddressProvider(clientConfig({ publicIpEnabled: false }), loggerStub);

        await provider.refresh(
            defaultAddressProvider(),
            [
                member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST })
            ]
        );

        expect(provider.get()).to.be.false;
    });

    it('should provide true for property set to true', async function () {
        const provider = translateAddressProvider(clientConfig({ publicIpEnabled: true }), loggerStub);

        await provider.refresh(defaultAddressProvider(), []);

        expect(provider.get()).to.be.true;
    });

    it('should provide false for property set to true and non-default address provider', async function () {
        const provider = translateAddressProvider(clientConfig({ publicIpEnabled: true }), loggerStub);

        await provider.refresh(
            nonDefaultAddressProvider(),
            [
                member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST })
            ]
        );

        expect(provider.get()).to.be.false;
    });

    it('should provide false for default config and enabled SSL config', async function () {
        const config = clientConfig();
        config.network.ssl.enabled = true;
        const provider = translateAddressProvider(config, loggerStub);

        await provider.refresh(
            defaultAddressProvider(),
            [
                member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST })
            ]
        );

        expect(provider.get()).to.be.false;
    });

    it('should provide false for default config and empty member list', async function () {
        const provider = translateAddressProvider(clientConfig(), loggerStub);

        await provider.refresh(defaultAddressProvider(), []);

        expect(provider.get()).to.be.false;
    });

    it('should provide false for default config and matching public-internal addresses (host and port)', async function () {
        const provider = translateAddressProvider(
            clientConfig({
                memberAddresses: [ `${REACHABLE_HOST}:5701` ]
            }),
            loggerStub
        );

        await provider.refresh(defaultAddressProvider(), [ member({ internalHost: REACHABLE_HOST }) ]);

        expect(provider.get()).to.be.false;
    });

    it('should provide false for default config and matching public-internal addresses (host only)', async function () {
        const provider = translateAddressProvider(
            clientConfig({
                memberAddresses: [ REACHABLE_HOST ]
            }),
            loggerStub
        );

        await provider.refresh(defaultAddressProvider(), [ member({ internalHost: REACHABLE_HOST }) ]);

        expect(provider.get()).to.be.false;
    });

    it('should provide false for default config and unreachable members', async function () {
        const provider = translateAddressProvider(clientConfig(), loggerStub);

        await provider.refresh(
            defaultAddressProvider(),
            [
                member({ internalHost: UNREACHABLE_HOST, publicHost: UNREACHABLE_HOST }),
                member({ internalHost: UNREACHABLE_HOST, publicHost: UNREACHABLE_HOST })
            ]
        );

        expect(provider.get()).to.be.false;
    });

    it('should provide false for default config and internally reachable members', async function () {
        const provider = translateAddressProvider(clientConfig(), loggerStub);

        await provider.refresh(
            defaultAddressProvider(),
            [
                member({ internalHost: REACHABLE_HOST, publicHost: UNREACHABLE_HOST }),
                member({ internalHost: REACHABLE_HOST, publicHost: UNREACHABLE_HOST })
            ]
        );

        expect(provider.get()).to.be.false;
    });

    it('should provide false for default config and members with no public address', async function () {
        const provider = translateAddressProvider(clientConfig(), loggerStub);

        await provider.refresh(
            defaultAddressProvider(),
            [ member({ internalHost: UNREACHABLE_HOST }) ]
        );

        expect(provider.get()).to.be.false;
    });

    it('should provide true for default config and publicly reachable single member', async function () {
        const provider = translateAddressProvider(clientConfig(), loggerStub);

        await provider.refresh(
            defaultAddressProvider(),
            [
                member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST })
            ]
        );

        expect(provider.get()).to.be.true;
    });

    it('should provide true for default config and publicly reachable members', async function () {
        const provider = translateAddressProvider(clientConfig(), loggerStub);

        await provider.refresh(
            defaultAddressProvider(),
            [
                member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST }),
                member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST }),
                member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST })
            ]
        );

        expect(provider.get()).to.be.true;
    });
});
