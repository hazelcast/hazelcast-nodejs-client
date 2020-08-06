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

const expect = require('chai').expect;
const sinon = require('sinon');
const winston = require('winston');
const Controller = require('./RC');
const HazelcastClient = require('../.').Client;
const LogLevel = require('../.').LogLevel;

describe('Logging Test', function () {

    let cluster, client;

    const winstonAdapter = {
        logger: winston.createLogger({
            transports: [
                new winston.transports.Console()
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
        return Controller.terminateCluster(cluster.id);
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
        let loggingHappened = false;
        winstonAdapter.logger.transports[0].on('logged', function (transport, level, msg, meta) {
            loggingHappened = true;
        });

        return HazelcastClient.newHazelcastClient({
            clusterName: cluster.id,
            customLogger: winstonAdapter
        }).then(function (hz) {
            client = hz;
            return expect(loggingHappened).to.be.true;
        });
    });

    it('no logging', function () {
        return HazelcastClient.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.logging.level': LogLevel.OFF
            }
        }).then(function (hz) {
            client = hz;
            return sinon.assert.notCalled(console.log);
        });
    });

    it('default logging in case of empty property', function () {
        return HazelcastClient.newHazelcastClient({
            clusterName: cluster.id
        }).then(function (hz) {
            client = hz;
            return sinon.assert.called(console.log);
        });
    });

    it('default logging in case of default property', function () {
        return HazelcastClient.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.logging.level': LogLevel.INFO
            }
        }).then(function (hz) {
            client = hz;
            return sinon.assert.called(console.log);
        });
    });

    it('error in case of unknown property value', function () {
        return expect(HazelcastClient.newHazelcastClient.bind(this, {
            clusterName: cluster.id,
            customLogger: 'unknw'
        })).to.throw(Error);
    });

    it('default logging, default level', function () {
        return HazelcastClient.newHazelcastClient({
            clusterName: cluster.id
        }).then(function (cl) {
            client = cl;
            return sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'INFO');
        });
    });

    it('default logging, error level', function () {
        return HazelcastClient.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.logging.level': LogLevel.ERROR
            }
        }).then(function (cl) {
            client = cl;
            return sinon.assert.notCalled(console.log);
        });
    });

    it('default logging, trace level', function () {
        return HazelcastClient.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.logging.level': LogLevel.TRACE
            }
        }).then(function (cl) {
            client = cl;
            sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'INFO');
            sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'TRACE');
        });
    });
});
