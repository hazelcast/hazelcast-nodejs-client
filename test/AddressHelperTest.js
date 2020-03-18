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

var Controller = require('./RC');
var expect = require('chai').expect;

var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;

describe('AddressHelper', function () {
    this.timeout(30000);

    var cluster;
    var client;

    before(function () {
        return Controller.createCluster(null, null).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function () {
            var cfg = new Config.ClientConfig();
            cfg.networkConfig.addresses = ['127.0.0.2', '127.0.0.1:5701'];
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function (res) {
            client = res;
        });
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });


    it('should try all addresses', function () {
        var knownAddresses = client.getClusterService().knownAddresses.map(function (address) {
            return address.toString();
        });

        expect(knownAddresses).to.have.members(['127.0.0.2:5701', '127.0.0.2:5702', '127.0.0.2:5703', '127.0.0.1:5701']);
    });
});
