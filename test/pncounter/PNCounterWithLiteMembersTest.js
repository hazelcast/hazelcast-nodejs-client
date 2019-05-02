/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var Controller = require('../RC');
var Client = require('../..').Client;
var Errors = require('../..').HazelcastErrors;
var fs = require('fs');
var path = require('path');
var Util = require('../Util');

describe('PNCounterWithLiteMembersTest', function () {

    var cluster;
    var client;
    var pncounter;

    before(function () {
        return Controller.createCluster(null, fs.readFileSync(path.resolve(__dirname, 'hazelcast_litemember.xml'), 'utf8')).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    beforeEach(function () {
        Util.markServerVersionAtLeast(this, client, '3.10');
        return client.getPNCounter('pncounter').then(function (counter) {
            pncounter = counter;
        });
    });

    afterEach(function () {
        return pncounter.destroy();
    });

    it('get throws NoDataMemberInClusterError', function () {
        return expect(pncounter.get()).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });

    it('getAndAdd throws NoDataMemberInClusterError', function () {
        return expect(pncounter.getAndAdd(1)).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });

    it('addAndGet throws NoDataMemberInClusterError', function () {
        return expect(pncounter.addAndGet(1)).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });

    it('getAndSubtract throws NoDataMemberInClusterError', function () {
        return expect(pncounter.getAndSubtract(1)).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });

    it('subtractAndGet throws NoDataMemberInClusterError', function () {
        return expect(pncounter.subtractAndGet(1)).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });

    it('getAndDecrement throws NoDataMemberInClusterError', function () {
        return expect(pncounter.getAndDecrement()).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });

    it('decrementAndGet throws NoDataMemberInClusterError', function () {
        return expect(pncounter.decrementAndGet()).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });

    it('incrementAndGet throws NoDataMemberInClusterError', function () {
        return expect(pncounter.incrementAndGet()).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });

    it('getAndIncrement throws NoDataMemberInClusterError', function () {
        return expect(pncounter.getAndIncrement()).to.be.rejectedWith(Errors.NoDataMemberInClusterError);
    });
});
