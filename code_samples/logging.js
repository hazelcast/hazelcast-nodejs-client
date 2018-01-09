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

var winston = require('winston');
var Config = require('../.').Config;
var HazelcastClient = require('../.').Client;

if(process.argv.length != 3){
    console.log('Run as node logging.js [logger]');
    console.log('[logger]: winston/default/off');
} else {
    var cfg = new Config.ClientConfig();

    if (process.argv[2] === 'winston') {
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

            log: function(level, className, message, furtherInfo) {
                this.logger.log(this.levels[level], className + ' ' + message);
            }
        };
        cfg.properties['hazelcast.logging'] = winstonAdapter;
    } else {
        cfg.properties['hazelcast.logging'] = process.argv[2];

    }
    HazelcastClient.newHazelcastClient(cfg).then(function(client){
        client.shutdown();
    });
}

