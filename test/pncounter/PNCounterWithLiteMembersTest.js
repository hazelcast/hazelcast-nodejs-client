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
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

const RC = require('../RC');
const { Client, NoDataMemberInClusterError } = require('../..');

describe('PNCounterWithLiteMembersTest', function () {

    let cluster;
    let client;
    let pncounter;

    before(function () {
        return RC.createCluster(null, fs.readFileSync(path.resolve(__dirname, 'hazelcast_litemember.xml'), 'utf8'))
            .then(function (cl) {
                cluster = cl;
                return RC.startMember(cluster.id);
            })
            .then(function () {
                return Client.newHazelcastClient({ clusterName: cluster.id });
            })
            .then(function (cl) {
                client = cl;
            });
    });

    after(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    beforeEach(function () {
        return client.getPNCounter('pncounter').then(function (counter) {
            pncounter = counter;
        });
    });

    afterEach(function () {
        return pncounter.destroy();
    });

    it('get throws NoDataMemberInClusterError', function () {
        return expect(pncounter.get()).to.be.rejectedWith(NoDataMemberInClusterError);
    });

    it('getAndAdd throws NoDataMemberInClusterError', function () {
        return expect(pncounter.getAndAdd(1)).to.be.rejectedWith(NoDataMemberInClusterError);
    });

    it('addAndGet throws NoDataMemberInClusterError', function () {
        return expect(pncounter.addAndGet(1)).to.be.rejectedWith(NoDataMemberInClusterError);
    });

    it('getAndSubtract throws NoDataMemberInClusterError', function () {
        return expect(pncounter.getAndSubtract(1)).to.be.rejectedWith(NoDataMemberInClusterError);
    });

    it('subtractAndGet throws NoDataMemberInClusterError', function () {
        return expect(pncounter.subtractAndGet(1)).to.be.rejectedWith(NoDataMemberInClusterError);
    });

    it('getAndDecrement throws NoDataMemberInClusterError', function () {
        return expect(pncounter.getAndDecrement()).to.be.rejectedWith(NoDataMemberInClusterError);
    });

    it('decrementAndGet throws NoDataMemberInClusterError', function () {
        return expect(pncounter.decrementAndGet()).to.be.rejectedWith(NoDataMemberInClusterError);
    });

    it('incrementAndGet throws NoDataMemberInClusterError', function () {
        return expect(pncounter.incrementAndGet()).to.be.rejectedWith(NoDataMemberInClusterError);
    });

    it('getAndIncrement throws NoDataMemberInClusterError', function () {
        return expect(pncounter.getAndIncrement()).to.be.rejectedWith(NoDataMemberInClusterError);
    });
});
