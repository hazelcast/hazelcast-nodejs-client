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
const fs = require('fs');
const http = require('http');
const querystring = require('querystring');

const RC = require('../../RC');
const { Client } = require('../../../../');
const { deferredPromise } = require('../../../../lib/util/Util');

describe('RestValueTest', function () {

    let cluster;
    let client;
    let member;

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_rest.xml', 'utf8'));
        member = await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('client should receive REST events from server as RestValue', async function () {
        const contentType = 'text/plain';
        const postData = querystring.stringify({
            key: 'value'
        });

        const deferred = deferredPromise();

        const queue = await client.getQueue('test');
        await queue.addItemListener({
            itemAdded: (event) => {
                const item = event.item;
                expect(item.contentType).to.equal(contentType);
                expect(item.value).to.equal(postData);
                deferred.resolve();
            }
        }, true);

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
            if (res.statusCode !== 200) {
                deferred.reject(res.statusCode);
            }
        });

        request.on('error', e => {
            deferred.reject(e);
        });

        request.write(postData);
        request.end();
        await deferred.promise;
    });
});
