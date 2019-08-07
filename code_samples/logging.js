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

var winston = require('winston');
var Config = require('hazelcast-client').Config;
var HazelcastClient = require('hazelcast-client').Client;
var LogLevel = require('hazelcast-client').LogLevel;

var cfg = new Config.ClientConfig();

var winstonAdapter = {
    logger: new (winston.Logger)({
        transports: [
            new (winston.transports.Console)()
        ]
    }),

    levels: [
        'off',
        'error',
        'warn',
        'info',
        'debug',
        'silly'
    ],

    off: function (level, objectName, message, furtherInfo) {
        this.logger.log(LogLevel.OFF, objectName, message, furtherInfo);
    },

    log: function (level, objectName, message, furtherInfo) {
        this.logger.log(this.levels[level], objectName + ': ' + message, furtherInfo);
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
cfg.customLogger = winstonAdapter;

HazelcastClient.newHazelcastClient(cfg).then(function (client) {
    client.shutdown();
});
