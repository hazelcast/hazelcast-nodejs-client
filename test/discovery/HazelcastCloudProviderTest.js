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

const sinon = require('sinon');
const expect = require('chai').expect;
const Promise = require('bluebird');
const LogLevel = require('../../lib/').LogLevel;

const IllegalStateError = require('../../').HazelcastErrors.IllegalStateError;
const LoggingService = require('../../lib/logging/LoggingService').LoggingService;
const Address = require('../../lib/Address').Address;
const HazelcastCloudAddressProvider = require('../../lib/discovery/HazelcastCloudAddressProvider').HazelcastCloudAddressProvider;
const HazelcastCloudDiscovery = require('../../lib/discovery/HazelcastCloudDiscovery').HazelcastCloudDiscovery;

describe('HazelcastCloudProviderTest', function () {

    const expectedAddresses = new Map();
    let hazelcastCloudDiscovery;
    let provider;

    before(function () {
        expectedAddresses.set('10.0.0.1:5701', new Address('198.51.100.1', 5701));
        expectedAddresses.set('10.0.0.1:5702', new Address('198.51.100.1', 5702));
        expectedAddresses.set('10.0.0.2:5701', new Address('198.51.100.2', 5701));
    });

    beforeEach(() => {
        const logger = new LoggingService(null, LogLevel.INFO).getLogger();
        hazelcastCloudDiscovery = new HazelcastCloudDiscovery();
        sinon.stub(HazelcastCloudDiscovery.prototype, 'discoverNodes').callsFake(() => Promise.resolve(expectedAddresses));

        provider = new HazelcastCloudAddressProvider(hazelcastCloudDiscovery, null, logger);
    });

    afterEach(function () {
        if (HazelcastCloudDiscovery.prototype.discoverNodes.restore
            && HazelcastCloudDiscovery.prototype.discoverNodes.restore.sinon) {
            HazelcastCloudDiscovery.prototype.discoverNodes.restore();
        }
    });

    it('loadAddresses', function () {
        return provider.loadAddresses().then((res) => {
            return expect(res).to.have.length(3);
        });
    });

    it('loadAddresses_whenErrorIsThrown', function () {
        HazelcastCloudDiscovery.prototype.discoverNodes.restore();
        sinon.stub(HazelcastCloudDiscovery.prototype, 'discoverNodes').callsFake(function () {
            return Promise.reject(new IllegalStateError('Expected exception'));
        });

        return provider.loadAddresses().then((res) => {
            return expect(res).to.have.length(0);
        });
    });

    it('translate_whenAddressIsNull_thenReturnNull', function () {
        return provider.translate(null).then((res) => {
            return expect(res).to.be.null;
        });
    });

    it('translate', function () {
        return provider.translate('10.0.0.1:5701').then((res) => {
            expect('198.51.100.1').to.equal(res.host);
            expect(5701).to.equal(res.port);
        });
    });

    it('refresh_and_translate', function () {
        return provider.refresh().then(
            provider.translate('10.0.0.1:5701').then((res) => {
                    expect('198.51.100.1').to.equal(res.host);
                    expect(5701).to.equal(res.port);
                }));
    });

    it('translate_whenNotFound_thenReturnNull', function () {
        const notAvailableAddress = new Address('127.0.0.3', 5701);
        return provider.translate(notAvailableAddress).then((res) => {
            return expect(res).to.be.null;
        });
    });

    it('refresh_whenException_thenLogWarning', function () {
        HazelcastCloudDiscovery.prototype.discoverNodes.restore();
        sinon.stub(HazelcastCloudDiscovery.prototype, 'discoverNodes').callsFake(function () {
            return Promise.reject(new IllegalStateError('Expected exception'));
        });
        provider.refresh();
    });

});
