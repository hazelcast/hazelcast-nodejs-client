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
const Client = require('../../.').Client;
const Config = require('../../.').Config;
const Controller = require('../RC');

describe('ClientLabelTest', function () {

    this.timeout(32000);

    let cluster;
    let client;

    before(function () {
        return Controller.createCluster(null, null)
            .then((c) => {
                cluster = c;
                return Controller.startMember(cluster.id);
            });
    });

    afterEach(function () {
        return client.shutdown();
    });

    after(function () {
        return Controller.terminateCluster(cluster.id);
    });


    it('labels should be received on member side', function () {
        const config = new Config.ClientConfig();
        config.clusterName = cluster.id;
        config.labels.add("testLabel");

        return Client.newHazelcastClient(config)
            .then((c) => {
                client = c;

                const script = 'var client = instance_0.getClientService().getConnectedClients().iterator().next();\n' +
                    'result = client.getLabels().iterator().next();\n';

                return Controller.executeOnController(cluster.id, script, 1);
            })
            .then((res) => {
                expect(res.result).to.not.be.null;

                expect(res.result.toString()).to.equal('testLabel');
            });
    });

});
