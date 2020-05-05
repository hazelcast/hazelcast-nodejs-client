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
const HazelcastClient = require('../../lib').Client;
const Controller = require('../RC');
const fs = require('fs');
const http = require('http');
const querystring = require('querystring');
const DeferredPromise = require('../../lib/Util').DeferredPromise;
const Buffer = require('safe-buffer').Buffer;
const Util = require('../Util');

describe('RestValueTest', function () {

    let cluster;
    let client;
    let member;

    before(function () {
        this.timeout(32000);
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_rest.xml', 'utf8'))
            .then(c => {
                cluster = c;
                return Controller.startMember(cluster.id);
            }).then(m => {
                member = m;
                return HazelcastClient.newHazelcastClient();
            }).then(c => {
                client = c;
            });
    });

    beforeEach(function () {
        Util.markServerVersionAtLeast(this, client, '3.8');
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('client should receive REST events from server as RestValue', function (done) {
        const contentType = 'text/plain';
        const value = {
            'key': 'value'
        };
        const postData = querystring.stringify(value);

        client.getQueue('test')
            .then((queue) => {
                const itemListener = {
                    itemAdded: (event) => {
                        const item = event.item;
                        expect(item.contentType).to.equal(contentType);
                        expect(item.value).to.equal(postData);
                        done();
                    }
                };
                return queue.addItemListener(itemListener, true);
            })
            .then(() => {
                const deferred = DeferredPromise();

                const options = {
                    hostname: member.host,
                    port: member.port,
                    path: '/hazelcast/rest/queues/test',
                    method: 'POST',
                    headers: {
                        'Content-Type': contentType,
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const request = http.request(options, res => {
                    if (res.statusCode === 200) {
                        deferred.resolve();
                    } else {
                        deferred.reject(res.statusCode);
                    }
                });

                request.on('error', e => {
                    deferred.reject(e);
                });

                request.write(postData);
                request.end();
                return deferred.promise;
            })
            .catch(e => {
                done(e);
            })
    });
});
