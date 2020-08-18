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
const RC = require('./RC');
const { Client } = require('../.');

describe('AutoPipeliningDisabledTest', function () {

    let cluster;
    let client;
    let map;

    const createClient = (clusterId) => {
        return Client.newHazelcastClient({
            clusterName: clusterId,
            properties: {
                ['hazelcast.client.autopipelining.enabled']: false
            }
        });
    };

    before(function () {
        this.timeout(32000);
        return RC.createCluster(null, null).then(c => {
            cluster = c;
            return RC.startMember(cluster.id);
        }).then(_ => {
            return createClient(cluster.id);
        }).then(c => {
            client = c;
        });
    });

    beforeEach(function () {
        return client.getMap('test').then(m => {
            map = m;
        });
    });

    afterEach(function () {
        return map.destroy();
    });

    after(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('basic map operations work fine', function () {
        return map.set('foo', 'bar')
            .then(() => map.get('foo'))
            .then(v => {
                return expect(v).to.equal('bar');
            });
    });

});

