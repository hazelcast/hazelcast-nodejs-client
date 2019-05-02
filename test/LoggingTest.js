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

var expect = require('chai').expect;
var sinon = require('sinon');
var winston = require('winston');
var Config = require('../.').Config;
var Controller = require('./RC');
var HazelcastClient = require('../.').Client;
var LogLevel = require('../.').LogLevel;
describe('Logging Test', function () {
    var cluster;
    var client;

    var winstonAdapter = {
        logger: new (winston.Logger)({
            transports: [
                new (winston.transports.Console)()
            ]
        }),

        levels: [
            'error',
            'warn',
            'info',
            'debug',
            'silly'
        ],

        log: function (level, objectName, message, furtherInfo) {
            this.logger.log(this.levels[level], objectName + ' ' + message, furtherInfo);
        },

        error: function (objectName, message, furtherInfo) {
            this.log(LogLevel.ERROR, objectName, message, furtherInfo);
        },

        debug: function (objectName, message, furtherInfo) {
            this.log(LogLevel.DEBUG, objectName, message, furtherInfo);
        },

        warn: function (objectName, message, furtherInfo) {
            this.log(LogLevel.WARN, objectName, message, furtherInfo);
        },

        info: function (objectName, message, furtherInfo) {
            this.log(LogLevel.INFO, objectName, message, furtherInfo);
        },

        trace: function (objectName, message, furtherInfo) {
            this.log(LogLevel.TRACE, objectName, message, furtherInfo);
        }
    };

    before(function () {
        return Controller.createCluster(null, null).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        });
    });

    after(function () {
        return Controller.shutdownCluster(cluster.id);
    });

    beforeEach(function () {
        sinon.spy(console, 'log');
    });

    afterEach(function () {
        if (client != null) {
            client.shutdown();
            client = null;
        }
        console.log.restore();
    });

    it('winston should emit logging event', function () {
        var loggingHappened = false;
        winstonAdapter.logger.on('logging', function (transport, level, msg, meta) {
            loggingHappened = true;
        });
        var cfg = new Config.ClientConfig();
        cfg.customLogger = winstonAdapter;
        return HazelcastClient.newHazelcastClient(cfg).then(function (hz) {
            client = hz;
            return expect(loggingHappened).to.be.true;
        });
    });

    it('no logging', function () {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging.level'] = LogLevel.OFF;
        return HazelcastClient.newHazelcastClient(cfg).then(function (hz) {
            client = hz;
            return sinon.assert.notCalled(console.log);
        });
    });

    it('default logging in case of empty property', function () {
        return HazelcastClient.newHazelcastClient().then(function (hz) {
            client = hz;
            return sinon.assert.called(console.log);
        });
    });

    it('default logging in case of default property', function () {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging.level'] = LogLevel.INFO;
        return HazelcastClient.newHazelcastClient(cfg).then(function (hz) {
            client = hz;
            return sinon.assert.called(console.log);
        });
    });

    it('error in case of unknown property value', function () {
        var cfg = new Config.ClientConfig();
        cfg.customLogger = 'unknw';
        return expect(HazelcastClient.newHazelcastClient.bind(this, cfg)).to.throw(Error);
    });

    it('default logging, default level', function () {
        var cfg = new Config.ClientConfig();
        return HazelcastClient.newHazelcastClient(cfg).then(function (cl) {
            client = cl;
            return sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'INFO');
        });
    });

    it('default logging, error level', function () {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging.level'] = LogLevel.ERROR;
        return HazelcastClient.newHazelcastClient(cfg).then(function (cl) {
            client = cl;
            return sinon.assert.notCalled(console.log);
        });
    });

    it('default logging, trace level', function () {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging.level'] = LogLevel.TRACE;
        return HazelcastClient.newHazelcastClient(cfg).then(function (cl) {
            client = cl;
            return sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'INFO');
            return sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'DEBUG');
            return sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'TRACE');
        });
    });
});
