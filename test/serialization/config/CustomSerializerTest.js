/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

var Controller = require('../../RC');
var expect = require('chai').expect;

var Client = require('../../../').Client;
var Musician = require('./Musician').Musician;

describe('CustomSerializer', function () {
    var cluster;

    before(function () {
        process.chdir('test/serialization/config');
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        });
    });

    after(function () {
        Controller.shutdownCluster(cluster.id);
        process.chdir('../../../');
    });

    it('should be configured declaratively', function () {
        var m = new Musician('Furkan');
        return Client.newHazelcastClient().then(function (client) {
            expect(client.getSerializationService().findSerializerFor(m).getId()).to.be.equal(10);
            var map;
            return client.getMap('musicians').then(function (mp) {
                map = mp;
                return map.put('neyzen', m);
            }).then(function () {
                return map.get('neyzen');
            }).then(function (res) {
                expect(res.name).to.be.equal('Furkan');
            });
        });
    });
});

