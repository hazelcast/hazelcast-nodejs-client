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

const TestUtil = require('../../../TestUtil');
const CompactUtil = require('../parallel/serialization/compact/CompactUtil');
const RC = require('../../RC');
const { Predicates } = require('../../../../lib');

const COMPACT_ENABLED_ZERO_CONFIG_XML = `
    <hazelcast xmlns="http://www.hazelcast.com/schema/config"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.hazelcast.com/schema/config
        http://www.hazelcast.com/schema/config/hazelcast-config-5.0.xsd">
        <serialization>
            <compact-serialization enabled="true" />
        </serialization>
    </hazelcast>
`;

describe('CompactRestartTest', function() {
    let cluster;
    let mapName;
    let member;
    let FieldKind;

    const testFactory = new TestUtil.TestFactory();

    try {
        FieldKind = require('../../../../lib/serialization/generic_record/FieldKind').FieldKind;
    } catch (e) {
        // no-op
    }

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        cluster = await testFactory.createClusterForSerialTests(undefined, COMPACT_ENABLED_ZERO_CONFIG_XML);
        member = await RC.startMember(cluster.id);
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    beforeEach(function () {
        mapName = TestUtil.randomString(10);
    });

    afterEach(async function () {
        await testFactory.shutdownAllClients();
    });

    it('should work with compact when cluster restart', async function() {
        const client = await testFactory.newHazelcastClientForSerialTests({
            clusterName: cluster.id,
            serialization: {
                compact: {
                    serializers: [new CompactUtil.FlexibleSerializer([FieldKind.INT32])]
                }
            }
        });
        TestUtil.markServerVersionAtLeast(this, client, '5.1.0');
        const map = await client.getMap(mapName);
        await map.put(1, new CompactUtil.Flexible({INT32: {value: 42}}));

        await RC.terminateMember(cluster.id, member.uuid);
        await RC.startMember(cluster.id);

        await map.put(1, new CompactUtil.Flexible({INT32: {value: 42}}));
        const obj = await map.get(1);
        obj.INT32.should.be.eq(42);

        // Perform a query to make sure that the schema is available on the cluster
        const values = await map.valuesWithPredicate(Predicates.sql('INT32 == 42'));
        values.size().should.be.eq(1);
    });
});
