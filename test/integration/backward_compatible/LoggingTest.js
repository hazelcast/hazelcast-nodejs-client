/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

const { expect } = require('chai');
const sinon = require('sinon');
const winston = require('winston');
const RC = require('../RC');
const { Client, LogLevel } = require('../../../');

describe('LoggingTest', function () {

    let cluster;
    let client;

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

    let consoleLogSpy;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        return RC.startMember(cluster.id);
    });

    after(async function () {
        return RC.terminateCluster(cluster.id);
    });

    beforeEach(function () {
        consoleLogSpy = sinon.spy(console, 'log');
    });

    afterEach(async function () {
        if (client != null) {
            await client.shutdown();
            client = null;
        }
        consoleLogSpy.restore();
    });

    it('winston should emit logging event', async function () {
        let loggingHappened = false;
        winstonAdapter.logger.transports[0].on('logged', () => {
            loggingHappened = true;
        });

        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            customLogger: winstonAdapter
        });
        expect(loggingHappened).to.be.true;
    });

    it('no logging', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.logging.level': 'OFF'
            }
        });
        sinon.assert.notCalled(console.log);
    });

    it('default logging in case of empty property', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
        sinon.assert.called(console.log);
    });

    it('default logging in case of default property', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.logging.level': 'INFO'
            }
        });
        sinon.assert.called(console.log);
    });

    it('error in case of unknown property value', function () {
        expect(() => Client.newHazelcastClient({
            clusterName: cluster.id,
            customLogger: 'unknw'
        })).to.throw(Error);
    });

    it('default logging, default level', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
        sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'INFO');
    });

    it('default logging, error level', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.logging.level': 'ERROR'
            }
        });
        sinon.assert.notCalled(console.log);
    });

    it('default logging, trace level', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.logging.level': 'TRACE'
            }
        });
        sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'INFO');
        sinon.assert.calledWithMatch(console.log, '[DefaultLogger] %s at %s: %s', 'TRACE');
    });
});
