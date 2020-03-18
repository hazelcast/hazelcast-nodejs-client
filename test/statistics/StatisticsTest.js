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

var Statistics = require("../../lib/statistics/Statistics").Statistics;
var expect = require('chai').expect;
var BuildInfo = require('../../lib/BuildInfo').BuildInfo;

var RC = require('../RC');
var Client = require('../../').Client;
var TestUtil = require('../Util');
var Util = require('../../lib/Util');
var Config = require('../../').Config;
var os = require('os');

describe('Statistics with default period', function () {

    var cluster;
    var client;
    var map;

    before(function () {
        TestUtil.markServerVersionAtLeast(this, null, '3.9.0');
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            var cfg = new Config.ClientConfig();
            var ncc = new Config.NearCacheConfig();
            ncc.name = 'nearCachedMap*';
            ncc.invalidateOnChange = false;
            cfg.nearCacheConfigs['nearCachedMap*'] = ncc;
            cfg.properties['hazelcast.client.statistics.enabled'] = true;
            return Client.newHazelcastClient(cfg).then(function (cl) {
                client = cl;
            })
        });
    });

    after(function () {
        TestUtil.markServerVersionAtLeast(this, null, '3.9.0');
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    beforeEach(function () {
        return client.getMap('nearCachedMap' + Math.random()).then(function (mp) {
            map = mp;
        });
    });

    afterEach(function () {
        return map.destroy();
    });

    it('should be enabled via configuration', function () {
        return TestUtil.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster, client);
        }).then(function (stats) {
            expect(stats).to.not.null;
            expect(stats).to.not.equal('');
        });
    });

    it('should contain statistics content', function () {
        return TestUtil.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster, client);
        }).then(function (stats) {
            expect(stats).to.not.be.null;
            expect(extractStringStatValue(stats, 'clientName')).to.equal(client.getName());
            expect(extractIntStatValue(stats, 'lastStatisticsCollectionTime')).to.be
                .within(Date.now() - Statistics.PERIOD_SECONDS_DEFAULT_VALUE * 2000, Date.now());
            expect(extractBooleanStatValue(stats, 'enterprise')).to.be.false;
            expect(extractStringStatValue(stats, 'clientType')).to.equal('NodeJS');
            expect(extractStringStatValue(stats, 'clientVersion')).to.equal(BuildInfo.getClientVersion());
            var ownerConnection = client.getClusterService().getOwnerConnection();
            expect(extractIntStatValue(stats, 'clusterConnectionTimestamp')).to.equal(ownerConnection.getStartTime());
            expect(extractStringStatValue(stats, 'clientAddress')).to.equal(ownerConnection.getLocalAddress().toString());
            expect(extractStringStatValue(stats, 'os.committedVirtualMemorySize')).to.equal('');
            expect(extractStringStatValue(stats, 'os.freeSwapSpaceSize')).to.equal('');
            expect(extractStringStatValue(stats, 'os.maxFileDescriptorCount')).to.equal('');
            expect(extractStringStatValue(stats, 'os.openFileDescriptorCount')).to.equal('');
            if (Util.getNodejsMajorVersion() >= 6) {
                expect(extractIntStatValue(stats, 'os.processCpuTime')).to.greaterThan(1000);
            } else {
                expect(extractStringStatValue(stats, 'os.processCpuTime')).to.equal('');
            }
            expect(extractFloatStatValue(stats, 'os.systemLoadAverage')).to.be.greaterThan(0);
            expect(extractIntStatValue(stats, 'os.totalPhysicalMemorySize')).to.equal(os.totalmem());
            expect(extractStringStatValue(stats, 'os.totalSwapSpaceSize')).to.equal('');
            expect(extractIntStatValue(stats, 'runtime.availableProcessors')).to.equal(os.cpus().length);
            expect(extractStringStatValue(stats, 'runtime.freeMemory')).to.equal('');
            expect(extractStringStatValue(stats, 'runtime.maxMemory')).to.equal('');
            expect(extractIntStatValue(stats, 'runtime.totalMemory')).to.greaterThan(0);
            expect(extractIntStatValue(stats, 'runtime.uptime')).to.greaterThan(0);
            expect(extractIntStatValue(stats, 'runtime.usedMemory')).to.greaterThan(0);
            expect(extractStringStatValue(stats, 'executionService.userExecutorQueueSize')).to.equal('');
        });
    });

    it('should contain near cache statistics content', function () {
        return map.put('key', 'value').then(function () {
            return map.get('key');
        }).then(function () {
            return map.get('key');
        }).then(function () {
            return TestUtil.promiseWaitMilliseconds(5000);
        }).then(function () {
            return getClientStatisticsFromServer(cluster, client);
        }).then(function (stats) {
            var nearCacheStats = 'nc.' + map.getName();
            expect(contains(stats, nearCacheStats + '.hits=1')).to.be.true;
            expect(contains(stats, nearCacheStats + '.creationTime=')).to.be.true;
            expect(contains(stats, nearCacheStats + '.misses=1')).to.be.true;
            expect(contains(stats, nearCacheStats + '.ownedEntryCount=1')).to.be.true;
        });
    });

    function contains(base, search) {
        var firstIndex = base.indexOf(search);
        return firstIndex > -1 && firstIndex == base.lastIndexOf(search);
    }
});

describe('Statistics with non-default period', function () {
    var cluster;
    var client;

    before(function () {
        TestUtil.markServerVersionAtLeast(this, null, '3.9.0');
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.statistics.enabled'] = true;
            cfg.properties['hazelcast.client.statistics.period.seconds'] = 2;
            return Client.newHazelcastClient(cfg).then(function (cl) {
                client = cl;
            });
        });
    });

    after(function () {
        TestUtil.markServerVersionAtLeast(this, null, '3.9.0');
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('should not change before period', function () {
        var stats1;
        return TestUtil.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster, client);
        }).then(function (st) {
            stats1 = st;
            return getClientStatisticsFromServer(cluster, client)
        }).then(function (stats2) {
            expect(stats1).to.be.equal(stats2);
        });
    });

    it('should change after period', function () {
        var stats1;
        return TestUtil.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster, client);
        }).then(function (st) {
            stats1 = st;
            return TestUtil.promiseWaitMilliseconds(2000)
        }).then(function () {
            return getClientStatisticsFromServer(cluster, client);
        }).then(function (stats2) {
            expect(stats1).not.to.be.equal(stats2);
        });
    });
});

describe('Statistics with negative period', function () {
    var client;
    var cluster;

    before(function () {
        TestUtil.markServerVersionAtLeast(this, null, '3.9.0');
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.statistics.enabled'] = true;
            cfg.properties['hazelcast.client.statistics.period.seconds'] = -2;
            return Client.newHazelcastClient(cfg)
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function () {
        TestUtil.markServerVersionAtLeast(this, null, '3.9.0');
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('should be enabled via configuration', function () {
        return TestUtil.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster, client);
        }).then(function (stats) {
            expect(stats).to.not.equal('');
        });
    });
});

function getClientStatisticsFromServer(cluster, client) {
    var clientUuid = client.getClusterService().uuid;
    var script =
        'clients=instance_0.getClientService().getConnectedClients().toArray()\n' +
        'for(i=0;i<clients.length;i++) {\n' +
        '   if (clients[i].getUuid().equals("' + clientUuid + '")) {\n' +
        '       result=clients[i].getClientStatistics();\n' +
        '       break;' +
        '   }\n' +
        '}\n';
    return RC.executeOnController(cluster.id, script, 1).then(function (response) {
        if (response.result != null) {
            return response.result.toString();
        }
        return null;
    });
}

function extractStringStatValue(stats, statName) {
    var re = new RegExp(statName + '=(.*?)(?:,|$)');
    var matches = stats.match(re);
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
