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
var Foo = require('./Foo').Foo;
var Address = require('./Address').Address;

describe('Factories', function () {
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
    })

    it('should be configured declaratively', function () {
        return Client.newHazelcastClient().then(function (client) {
            var map;
            return client.getMap('furkan').then(function (mp) {
                map = mp;
                return map.put('foo', new Foo("elma"));
            }).then(function () {
                return map.put('address', new Address('Sahibiata', 42000, 'Konya', 'Turkey'))
            }).then(function () {
                return map.get('foo');
            }).then(function (res) {
                expect(res.foo).to.be.equal('elma');
                return map.get('address');
            }).then(function (res) {
                expect(res.street).to.be.equal('Sahibiata');
                expect(res.zipCode).to.be.equal(42000);
                expect(res.city).to.be.equal('Konya');
                expect(res.state).to.be.equal('Turkey');
                client.shutdown();
            });
        });
    });
});
