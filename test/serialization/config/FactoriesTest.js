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

var Controller = require('../../RC');
var expect = require('chai').expect;
var path = require('path');

var Client = require('../../../').Client;
var Foo = require('./Foo').Foo;
var Address = require('./Address').Address;

describe('Factories', function () {
    var cluster;
    var client;

    before(function () {
        process.env['HAZELCAST_CLIENT_CONFIG'] = path.join(__dirname, 'customserializer.json');
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        });
    });

    after(function () {
        delete process.env['HAZELCAST_CLIENT_CONFIG'];
        return Controller.shutdownCluster(cluster.id);
    });

    afterEach(function () {
        if (client != null) {
            client.shutdown();
        }
    });

    it('should be configured declaratively', function () {
        return Client.newHazelcastClient().then(function (cl) {
            client = cl;
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
            });
        });
    });
});
