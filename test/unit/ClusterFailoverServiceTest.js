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

const {
    CandidateClusterContext,
    ClusterFailoverService
} = require('../../lib/ClusterFailoverService');
const { LifecycleServiceImpl } = require('../../lib/LifecycleService');

describe('ClusterFailoverServiceTest', function () {

    let lifecycleServiceStub;

    function clusterContext(clusterName) {
        return new CandidateClusterContext(clusterName, null, null);
    }

    function failoverService(maxTryCount, contexts) {
        return new ClusterFailoverService(maxTryCount, contexts, lifecycleServiceStub);
    }

    beforeEach(function () {
        lifecycleServiceStub = sandbox.stub(LifecycleServiceImpl.prototype);
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('current: should return the first context', function () {
        const contexts = [clusterContext('foo'), clusterContext('bar')];
        const service = failoverService(1, contexts);

        expect(service.current()).to.be.equal(contexts[0]);
        expect(service.current()).to.be.equal(contexts[0]);
    });

    it('tryNextCluster: should resolve immediately after client shutdown', async function () {
        lifecycleServiceStub.isRunning.returns(false);
        const contexts = [clusterContext('foo'), clusterContext('bar')];
        const service = failoverService(1, contexts);

        const result = await service.tryNextCluster(() => Promise.resolve(true));

        expect(result).to.be.false;
        expect(service.current()).to.be.equal(contexts[0]);
    });

    it('tryNextCluster: should resolve immediately for zero max try count', async function () {
        lifecycleServiceStub.isRunning.returns(true);
        const contexts = [clusterContext('foo'), clusterContext('bar')];
        const service = failoverService(0, contexts);

        const result = await service.tryNextCluster(() => Promise.resolve(true));

        expect(result).to.be.false;
        expect(service.current()).to.be.equal(contexts[0]);
    });

    it('tryNextCluster: should invoke function that resolves to true once and switch to next context', async function () {
        lifecycleServiceStub.isRunning.returns(true);
        const contexts = [clusterContext('foo'), clusterContext('bar')];
        const service = failoverService(42, contexts);

        const fn = sandbox.spy((ctx) => {
            if (contexts[0] !== ctx) {
                return Promise.resolve(new Error('Wrong context'));
            }
            return Promise.resolve(true);
        });
        const result = await service.tryNextCluster(fn);

        expect(result).to.be.true;
        expect(fn.callCount).to.be.equal(1);
        expect(service.current()).to.be.equal(contexts[1]);
    });

    it('tryNextCluster: should iterate over contexts with respect to max try count', async function () {
        lifecycleServiceStub.isRunning.returns(true);
        const contexts = [clusterContext('foo'), clusterContext('bar'), clusterContext('baz')];
        const maxTryCount = 4;
        const service = failoverService(maxTryCount, contexts);

        let cnt = 0;
        const fn = sandbox.spy((ctx) => {
            const expectedCtx = contexts[++cnt % contexts.length];
            if (expectedCtx !== ctx) {
                return Promise.resolve(new Error('Wrong context at iteration ' + cnt));
            }
            return Promise.resolve(false);
        });
        const result = await service.tryNextCluster(fn);

        expect(result).to.be.false;
        expect(cnt).to.be.equal(maxTryCount);
        expect(fn.callCount).to.be.equal(maxTryCount);
        expect(service.current()).to.be.equal(contexts[maxTryCount % contexts.length]);
    });
});
