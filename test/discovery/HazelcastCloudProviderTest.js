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


var IllegalStateError = require('../../').HazelcastErrors.IllegalStateError;

var Address = require('../../lib/Address');
var sinon = require('sinon');
var expect = require('chai').expect;
var LoggingService = require('../../lib/logging/LoggingService').LoggingService;
var Promise = require('bluebird');
var LogLevel = require('../../lib/').LogLevel;

var HazelcastCloudAddressProvider = require('../../lib/discovery/HazelcastCloudAddressProvider').HazelcastCloudAddressProvider;
var HazelcastCloudDiscovery = require('../../lib/discovery/HazelcastCloudDiscovery').HazelcastCloudDiscovery;

describe('HazelcastCloudProvider Test', function () {
    var expectedAddresses = new Map();
    var hazelcastCloudDiscovery;
    var provider;

    before(function () {
        expectedAddresses.set('10.0.0.1:5701', new Address('198.51.100.1', 5701));
        expectedAddresses.set('10.0.0.1:5702', new Address('198.51.100.1', 5702));
        expectedAddresses.set('10.0.0.2:5701', new Address('198.51.100.2', 5701));

        var logger = new LoggingService(null, LogLevel.INFO).getLogger();
        hazelcastCloudDiscovery = new HazelcastCloudDiscovery();
        sinon.stub(HazelcastCloudDiscovery.prototype, 'discoverNodes').callsFake(() => Promise.resolve(expectedAddresses));

        provider = new HazelcastCloudAddressProvider(hazelcastCloudDiscovery, null, logger);
    });

    afterEach(function () {
        HazelcastCloudDiscovery.prototype.discoverNodes.restore();
    });


    it('loadAddresses', function () {
        return provider.loadAddresses().then((res) => {
            return expect(res).to.have.length(3);
        });
    });

    it('loadAddresses_whenErrorIsThrown', function () {
        sinon.stub(HazelcastCloudDiscovery.prototype, 'discoverNodes').callsFake(function () {
            return Promise.reject(new IllegalStateError('Expected exception'));
        });

        return provider.loadAddresses().then((res) => {
            return expect(res).to.have.length(0);
        });
    });

});
