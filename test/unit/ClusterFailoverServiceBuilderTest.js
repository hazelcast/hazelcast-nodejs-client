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

const { ClusterFailoverServiceBuilder } = require('../../lib/ClusterFailoverService');
const { LifecycleServiceImpl } = require('../../lib/LifecycleService');
const { LoggingService } = require('../../lib/logging/LoggingService');
const { ClientConfigImpl } = require('../../lib/config/Config');
const { DefaultAddressProvider } = require('../../lib/connection/DefaultAddressProvider');
const { HazelcastCloudAddressProvider } = require('../../lib/discovery/HazelcastCloudAddressProvider');
const { IllegalStateError } = require('../../');

describe('ClusterFailoverServiceBuilderTest', function () {

    let lifecycleServiceStub;
    let loggingServiceStub;

    function clientConfig(clusterName) {
        const config = new ClientConfigImpl();
        if (clusterName) {
            config.clusterName = clusterName;
        }
        return config;
    }

    function serviceBuilder(tryCount, configs) {
        return new ClusterFailoverServiceBuilder(tryCount, configs, lifecycleServiceStub, loggingServiceStub);
    }

    beforeEach(function () {
        lifecycleServiceStub = sandbox.stub(LifecycleServiceImpl.prototype);
        loggingServiceStub = sandbox.stub(LoggingService.prototype);
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should initialize service correctly for single default config', function () {
        const builder = serviceBuilder(42, [ clientConfig() ]);

        const failoverService = builder.build();

        expect(failoverService.maxTryCount).to.be.equal(42);
        const currentCtx = failoverService.current();
        expect(currentCtx.clusterName).to.be.equal('dev');
        expect(currentCtx.addressProvider).to.be.instanceOf(DefaultAddressProvider);
        expect(currentCtx.customCredentials).to.be.null;
    });

    it('should initialize service correctly for single config with custom credentials', function () {
        const config = clientConfig('credentials');
        const creds = {};
        config.customCredentials = creds;
        const builder = serviceBuilder(1, [ config ]);

        const failoverService = builder.build();

        const currentCtx = failoverService.current();
        expect(currentCtx.clusterName).to.be.equal('credentials');
        expect(currentCtx.addressProvider).to.be.instanceOf(DefaultAddressProvider);
        expect(currentCtx.customCredentials).to.be.equal(creds);
    });

    it('should initialize service correctly for single config with cloud token', function () {
        const config = clientConfig('cloud');
        config.network.hazelcastCloud.discoveryToken = 'TOKEN';
        const builder = serviceBuilder(1, [ config ]);

        const failoverService = builder.build();

        const currentCtx = failoverService.current();
        expect(currentCtx.clusterName).to.be.equal('cloud');
        expect(currentCtx.addressProvider).to.be.instanceOf(HazelcastCloudAddressProvider);
        expect(currentCtx.customCredentials).to.be.null;
    });

    it('should initialize service correctly for multiple configs', function () {
        const builder = serviceBuilder(1, [ clientConfig('foo'), clientConfig('bar') ]);

        const failoverService = builder.build();

        expect(failoverService.maxTryCount).to.be.equal(1);
        const contexts = failoverService.candidateClusters;
        expect(contexts).to.have.lengthOf(2);
        expect(contexts[0].clusterName).to.be.equal('foo');
        expect(contexts[1].clusterName).to.be.equal('bar');
    });

    it('should throw for config with both cloud token and member address list', function () {
        const config = clientConfig();
        config.network.hazelcastCloud.discoveryToken = 'TOKEN';
        config.network.clusterMembers.push('127.0.0.1');
        const builder = serviceBuilder(42, [ config ]);

        expect(() => builder.build()).to.throw(IllegalStateError);
    });
});
