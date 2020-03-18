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

var chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
var expect = chai.expect;

var net = require('net');

var Config = require('../.').Config;
var Hazelcast = require('../.').Client;
var Controller = require('./RC');
var Errors = require('../').HazelcastErrors;

describe('ConnectionManager', function () {

    var cluster;
    var member;
    var client;
    var testend;
    var server;

    before(function () {
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        }).then(function (m) {
            member = m;
        });
    });

    beforeEach(function () {
        testend = false;
    });

    afterEach(function () {
        testend = true;
        stopUnresponsiveServer();
        if (client != null) {
            return client.shutdown();
        }
    });

    after(function () {
        return Controller.shutdownCluster(cluster.id);
    });


    function startUnresponsiveServer(port) {
        server = net.createServer(function (socket) {
            //no-response
        });
        server.listen(port);
    }

    function stopUnresponsiveServer() {
        server.close();
    }

    it('gives up connecting after timeout', function () {
        var timeoutTime = 1000;
        var cfg = new Config.ClientConfig();
        cfg.networkConfig.connectionTimeout = timeoutTime;
        startUnresponsiveServer(9999);
        return Hazelcast.newHazelcastClient(cfg).then(function (cl) {
            client = cl;
            return client.getConnectionManager().getOrConnect({'host': 'localhost', 'port': 9999});
        }).should.eventually.be.rejected;
    });

    it('does not give up when timeout=0', function (done) {
        this.timeout(8000);

        var timeoutTime = 0;
        var cfg = new Config.ClientConfig();
        cfg.networkConfig.connectionTimeout = timeoutTime;
        startUnresponsiveServer(9999);

        var scheduled = setTimeout(function () {
            done();
        }, 6000);//5000 is default timeout. client should still be trying.

        Hazelcast.newHazelcastClient(cfg).then(function (cl) {
            client = cl;
            return client.getConnectionManager().getOrConnect({'host': 'localhost', 'port': 9999});
        }).then(function (value) {
            clearTimeout(scheduled);
            done(new Error('Client should be retrying!'));
        }).catch(function (e) {
            clearTimeout(scheduled);
            if (!testend) {
                done(new Error('Client should be retrying!\n' + e));
            }
        });
    });

    it('should throw IllegalStateError if there is an incompatible server', function () {
        client = null;
        var timeoutTime = 100;
        var cfg = new Config.ClientConfig();
        cfg.networkConfig.connectionTimeout = timeoutTime;
        cfg.networkConfig.addresses = ['127.0.0.1:9999'];
        startUnresponsiveServer(9999);
        return expect(Hazelcast.newHazelcastClient(cfg)).to.be.rejectedWith(Errors.IllegalStateError);
    });

});
