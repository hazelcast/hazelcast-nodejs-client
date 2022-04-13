/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const os = require('os');

const RC = require('../../../RC');
const { BuildInfo } = require('../../../../../lib/BuildInfo');
const { Statistics } = require('../../../../../lib/statistics/Statistics');
const TestUtil = require('../../../../TestUtil');

async function getClientStatisticsFromServer(cluster, client) {
    const clientUuid = client.getConnectionManager().getClientUuid();
    const script =
        'var stats = instance_0.getOriginal().node.getClientEngine().getClientStatistics();\n' +
        'var keys = stats.keySet().toArray();\n' +
        'for (var i = 0; i < keys.length; i++) {\n' +
        '  if (keys[i].toString().equals("' + clientUuid + '")) {\n' +
        '    result = stats.get(keys[i]).clientAttributes();\n' +
        '    break;\n' +
        '  }\n' +
        '}\n';
    const response = await RC.executeOnController(cluster.id, script, 1);
    if (response.result != null) {
        return response.result.toString();
    }
    return null;
}

function extractStringStatValue(stats, statName) {
    const re = new RegExp(statName + '=(.*?)(?:,|$)');
    const matches = stats.match(re);
    return matches[1];
}

function extractFloatStatValue(stats, statName) {
    return Number.parseFloat(extractStringStatValue(stats, statName));
}

function extractBooleanStatValue(stats, statName) {
    return 'true' === extractStringStatValue(stats, statName);
}

function extractIntStatValue(stats, statName) {
    return Number.parseInt(extractStringStatValue(stats, statName));
}

const testFactory = new TestUtil.TestFactory();
[true, false].forEach((useProps) => {
    describe('StatisticsTest (default period) ' + (useProps ? 'using statistics config' : 'using metrics config'), function () {
        let cluster;
        let client;
        let map;

        before(async function () {
            // metrics added in 5.1.0
            if (!useProps) {
                TestUtil.markClientVersionAtLeast(this, '5.1.0');
            }
            cluster = await testFactory.createClusterForSerialTests();
            const member = await RC.startMember(cluster.id);
            const config = {
                clusterName: cluster.id,
                nearCaches: {
                    'nearCachedMap*': {
                        invalidateOnChange: false
                    }
                },
                network: {
                    clusterMembers: [`127.0.0.1:${member.port}`]
                }
            };
            if (useProps) {
                config.properties = {
                    'hazelcast.client.statistics.enabled': true
                };
            } else {
                config.metrics = {
                    enabled: true
                };
            }
            client = await testFactory.newHazelcastClientForSerialTests(config);
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        beforeEach(async function () {
            map = await client.getMap('nearCachedMap' + Math.random());
        });

        afterEach(async function () {
            await map.destroy();
        });

        function containsOnce(base, search) {
            const firstIndex = base.indexOf(search);
            return firstIndex > -1 && firstIndex === base.lastIndexOf(search);
        }

        it('should be enabled via configuration', async function () {
            await TestUtil.promiseWaitMilliseconds(1000);
            const stats = await getClientStatisticsFromServer(cluster, client);
            expect(stats).to.not.null;
            expect(stats).to.not.equal('');
        });

        it('should contain statistics content', async function () {
            await TestUtil.promiseWaitMilliseconds(1000);
            const stats = await getClientStatisticsFromServer(cluster, client);
            expect(stats).to.not.be.null;
            expect(extractStringStatValue(stats, 'clientName')).to.equal(client.getName());
            expect(extractIntStatValue(stats, 'lastStatisticsCollectionTime')).to.be
                .within(Date.now() - Statistics.PERIOD_SECONDS_DEFAULT_VALUE * 2000, Date.now());
            expect(extractBooleanStatValue(stats, 'enterprise')).to.be.false;
            const expectedClientType = TestUtil.isClientVersionAtLeast('4.0.2') ? 'NJS' : 'NodeJS';
            expect(extractStringStatValue(stats, 'clientType')).to.equal(expectedClientType);
            expect(extractStringStatValue(stats, 'clientVersion')).to.equal(BuildInfo.getClientVersion());
            const connection = TestUtil.getRandomConnection(client);
            expect(extractIntStatValue(stats, 'clusterConnectionTimestamp')).to.equal(connection.getStartTime());
            expect(extractStringStatValue(stats, 'clientAddress')).to.equal(connection.getLocalAddress().toString());
            expect(extractIntStatValue(stats, 'os.processCpuTime')).to.greaterThan(1000);
            expect(extractFloatStatValue(stats, 'os.systemLoadAverage')).to.be.at.least(0);
            expect(extractIntStatValue(stats, 'os.totalPhysicalMemorySize')).to.equal(os.totalmem());
            expect(extractIntStatValue(stats, 'runtime.availableProcessors')).to.equal(os.cpus().length);
            expect(extractIntStatValue(stats, 'runtime.totalMemory')).to.greaterThan(0);
            expect(extractIntStatValue(stats, 'runtime.uptime')).to.greaterThan(0);
            expect(extractIntStatValue(stats, 'runtime.usedMemory')).to.greaterThan(0);
        });

        it('should contain near cache statistics content', async function () {
            await map.put('key', 'value');
            await map.get('key');
            await map.get('key');
            await TestUtil.promiseWaitMilliseconds(5000);
            const stats = await getClientStatisticsFromServer(cluster, client);
            const nearCacheStats = 'nc.' + map.getName();
            expect(containsOnce(stats, nearCacheStats + '.hits=1')).to.be.true;
            expect(containsOnce(stats, nearCacheStats + '.creationTime=')).to.be.true;
            expect(containsOnce(stats, nearCacheStats + '.misses=1')).to.be.true;
            expect(containsOnce(stats, nearCacheStats + '.ownedEntryCount=1')).to.be.true;
        });
    });
});

[true, false].forEach((useProps) => {
    describe('StatisticsTest (non-default period) ' + (useProps ? 'using statistics config' : 'using metrics config'),
        function () {
        let cluster;
        let client;

        before(async function () {
            // metrics added in 5.1.0
            if (!useProps) {
                TestUtil.markClientVersionAtLeast(this, '5.1.0');
            }
            cluster = await testFactory.createClusterForSerialTests();
            const member = await RC.startMember(cluster.id);
            const config = {
                clusterName: cluster.id,
                network: {
                    clusterMembers: [`127.0.0.1:${member.port}`]
                }
            };
            if (useProps) {
                config.properties = {
                    'hazelcast.client.statistics.enabled': true,
                    'hazelcast.client.statistics.period.seconds': 2
                };
            } else {
                config.metrics = {
                    enabled: true,
                    collectionFrequencySeconds: 2
                };
            }
            client = await testFactory.newHazelcastClientForSerialTests(config);
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        it('should not change before period', async function () {
            await TestUtil.promiseWaitMilliseconds(1000);
            const stats1 = await getClientStatisticsFromServer(cluster, client);
            const stats2 = await getClientStatisticsFromServer(cluster, client);
            expect(stats1).to.be.equal(stats2);
        });

        it('should change after period', async function () {
            await TestUtil.promiseWaitMilliseconds(1000);
            const stats1 = await getClientStatisticsFromServer(cluster, client);
            await TestUtil.promiseWaitMilliseconds(2000);
            const stats2 = await getClientStatisticsFromServer(cluster, client);
            expect(stats1).not.to.be.equal(stats2);
        });
    });
});

describe('StatisticsTest (negative period)', function () {
    let client;
    let cluster;

    before(async function () {
        cluster = await testFactory.createClusterForSerialTests();
        const member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForSerialTests({
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.statistics.enabled': true,
                'hazelcast.client.statistics.period.seconds': -2
            },
            network: {
                clusterMembers: [`127.0.0.1:${member.port}`]
            }
        });
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('should be enabled via configuration', async function () {
        await TestUtil.promiseWaitMilliseconds(1000);
        const stats = await getClientStatisticsFromServer(cluster, client);
        expect(stats).to.not.equal('');
    });
});
