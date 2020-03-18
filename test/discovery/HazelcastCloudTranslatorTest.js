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

var HazelcastCloudDiscovery = require('../../lib/discovery/HazelcastCloudDiscovery').HazelcastCloudDiscovery;

var Address = require('../../lib/Address');
var sinon = require('sinon');
var expect = require('chai').expect;
var LoggingService = require('../../lib/logging/LoggingService').LoggingService;
var Promise = require('bluebird');
var IllegalStateError = require('../../lib/HazelcastError').IllegalStateError;

var HazelcastCloudAddressTranslator = require('../../lib/discovery/HazelcastCloudAddressTranslator').HazelcastCloudAddressTranslator;
var LogLevel = require('../../lib/').LogLevel;

describe('HazelcastCloudTranslator Test', function () {

    var lookup = new Map();
    var privateAddress;
    var publicAddress;
    var translator;
    var hazelcastCloudDiscovery;

    before(function () {
        privateAddress = '127.0.0.1:5701';
        publicAddress = new Address('192.168.0.1', 5701);
        lookup.set(privateAddress, publicAddress);
        lookup.set('127.0.0.2:5701', new Address('192.168.0.2', 5701));

        var logger = new LoggingService(null, LogLevel.INFO).getLogger();
        hazelcastCloudDiscovery = new HazelcastCloudDiscovery();

        translator = new HazelcastCloudAddressTranslator(hazelcastCloudDiscovery, null, logger);
    });

    beforeEach(function () {
        sinon.stub(HazelcastCloudDiscovery.prototype, 'discoverNodes').callsFake(() => Promise.resolve(lookup));
    });

    afterEach(function () {
        HazelcastCloudDiscovery.prototype.discoverNodes.restore();
    });

    it('translate_whenAddressIsNull_thenReturnNull', function () {
        return translator.translate(null).then((res) => {
            expect(res).to.be.null;
        });
    });

    it('translate', function () {
        return translator.translate(privateAddress).then((res) => {
            expect(publicAddress.host).to.equal(res.host);
            expect(publicAddress.port).to.equal(res.port);
        });
    });

    it('refresh_and_translate', function () {
        return translator.refresh().then(
            translator.translate(privateAddress).then((res) => {
                expect(publicAddress.host).to.equal(res.host);
                expect(publicAddress.port).to.equal(res.port);
            }));
    });

    it('translate_whenNotFound_thenReturnNull', function () {
        var notAvailableAddress = new Address('127.0.0.3', 5701);
        return translator.translate(notAvailableAddress).then((res) => {
            expect(res).to.be.null;
        });
    });

    it('refresh_whenException_thenLogWarning', function () {
        HazelcastCloudDiscovery.prototype.discoverNodes.restore();
        sinon.stub(HazelcastCloudDiscovery.prototype, 'discoverNodes').callsFake(function () {
            return Promise.reject(new IllegalStateError('Expected exception'));
        });
        translator.refresh();
    });

});
