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

var expect = require('chai').expect;
var path = require('path');
var ConfigBuilder = require('../../').ConfigBuilder;
var Config = require('../../').Config;
var Long = require('long');
var AddressHelper = require("../../lib/Util").AddressHelper;

describe('ConfigBuilder Test', function () {
    var configFull;

    before(function () {
        var configBuilder = new ConfigBuilder();
        process.env['HAZELCAST_CLIENT_CONFIG'] = path.join(__dirname, 'configurations/full.json');
        return configBuilder.loadConfig().then(function () {
            configFull = configBuilder.build();
        });
    });

    after(function () {
        delete process.env['HAZELCAST_CLIENT_CONFIG'];
    });

    it('networkConfig', function () {
        var networkCfg = configFull.networkConfig;

        var addresses0 = AddressHelper.getSocketAddresses(networkCfg.addresses[0]);
        expect(addresses0[0].host).to.equal('127.0.0.9');
        expect(addresses0[0].port).to.equal(5701);
        expect(addresses0[1].host).to.equal('127.0.0.9');
        expect(addresses0[1].port).to.equal(5702);
        expect(addresses0[2].host).to.equal('127.0.0.9');
        expect(addresses0[2].port).to.equal(5703);
        expect(addresses0.length).to.equal(3);

        var addresses1 = AddressHelper.getSocketAddresses(networkCfg.addresses[1]);
        expect(addresses1[0].host).to.equal('127.0.0.2');
        expect(addresses1[0].port).to.equal(5702);
        expect(addresses1.length).to.equal(1);


        var address0 = AddressHelper.createAddressFromString(networkCfg.addresses[0]);
        var address1 = AddressHelper.createAddressFromString(networkCfg.addresses[1]);
        expect(address0.host).to.equal('127.0.0.9');
        expect(address0.port).to.be.undefined;
        expect(address1.host).to.equal('127.0.0.2');
        expect(address1.port).to.equal(5702);
        expect(networkCfg.smartRouting).to.be.false;
        expect(networkCfg.connectionTimeout).to.equal(6000);
        expect(networkCfg.connectionAttemptPeriod).to.equal(4000);
        expect(networkCfg.connectionAttemptLimit).to.equal(3);
        expect(networkCfg.sslConfig.enabled).to.be.true;
        expect(networkCfg.sslConfig.sslOptions).to.be.null;
        expect(networkCfg.sslConfig.sslOptionsFactoryConfig.path).to.equal('path/to/file');
        expect(networkCfg.sslConfig.sslOptionsFactoryConfig.exportedName).to.equal('exportedName');
        expect(networkCfg.sslConfig.sslOptionsFactoryProperties['userDefinedProperty1']).to.equal('userDefinedValue');
    });

    it('group', function () {
        var groupCfg = configFull.groupConfig;
        expect(groupCfg.name).to.equal('hazel');
        expect(groupCfg.password).to.equal('cast');
    });

    it('properties', function () {
        var properties = configFull.properties;
        expect(properties['hazelcast.client.heartbeat.timeout']).to.equal(10000);
        expect(properties['hazelcast.client.invocation.retry.pause.millis']).to.equal(4000);
        expect(properties['hazelcast.client.invocation.timeout.millis']).to.equal(180000);
        expect(properties['hazelcast.invalidation.reconciliation.interval.seconds']).equal(50);
        expect(properties['hazelcast.invalidation.max.tolerated.miss.count']).to.equal(15);
        expect(properties['hazelcast.invalidation.min.reconciliation.interval.seconds']).to.equal(60);
    });

    it('serialization', function () {
        var serializationCfg = configFull.serializationConfig;
        expect(serializationCfg.defaultNumberType).to.equal('integer');
        expect(serializationCfg.isBigEndian).to.equal(false);
        expect(serializationCfg.portableVersion).to.equal(1);
        expect(serializationCfg.jsonStringDeserializationPolicy)
            .to.equal(Config.JsonStringDeserializationPolicy.NO_DESERIALIZATION);
        expect(serializationCfg.stringSerializationPolicy)
            .to.equal(Config.StringSerializationPolicy.LEGACY);
        expect(serializationCfg.dataSerializableFactoryConfigs[0].path).to.equal('path/to/file');
        expect(serializationCfg.dataSerializableFactoryConfigs[0].exportedName).to.equal('exportedName');

        expect(serializationCfg.portableFactoryConfigs[1].path).to.equal('path/to/file');
        expect(serializationCfg.portableFactoryConfigs[1].exportedName).to.equal('exportedName');

        expect(serializationCfg.globalSerializerConfig.exportedName).to.equal('exportedName');
        expect(serializationCfg.globalSerializerConfig.path).to.equal('path/to/file');

        expect(serializationCfg.customSerializerConfigs[2].exportedName).to.equal('CustomSerializer1');
        expect(serializationCfg.customSerializerConfigs[2].path).to.equal('path/to/custom');

        expect(serializationCfg.customSerializerConfigs[3].exportedName).to.equal('CustomSerializer2');
        expect(serializationCfg.customSerializerConfigs[3].path).to.equal('path/to/custom');
    });

    it('nearCaches', function () {
        var nearCacheConfigs = configFull.nearCacheConfigs;
        expect(nearCacheConfigs['nc-map'].name).to.equal('nc-map');
        expect(nearCacheConfigs['nc-map'].invalidateOnChange).to.be.false;
        expect(nearCacheConfigs['nc-map'].maxIdleSeconds).to.equal(2);
        expect(nearCacheConfigs['nc-map'].inMemoryFormat).to.equal(Config.InMemoryFormat.OBJECT);
        expect(nearCacheConfigs['nc-map'].timeToLiveSeconds).to.equal(3);
        expect(nearCacheConfigs['nc-map'].evictionPolicy).to.equal(Config.EvictionPolicy.LRU);
        expect(nearCacheConfigs['nc-map'].evictionMaxSize).to.equal(3000);
        expect(nearCacheConfigs['nc-map'].evictionSamplingCount).to.equal(4);
        expect(nearCacheConfigs['nc-map'].evictionSamplingPoolSize).to.equal(8);

        expect(nearCacheConfigs['nc-map2'].name).to.equal('nc-map2');
        expect(nearCacheConfigs['nc-map2'].invalidateOnChange).to.be.false;
        expect(nearCacheConfigs['nc-map2'].maxIdleSeconds).to.equal(2);
        expect(nearCacheConfigs['nc-map2'].inMemoryFormat).to.equal(Config.InMemoryFormat.OBJECT);
        expect(nearCacheConfigs['nc-map2'].timeToLiveSeconds).to.equal(3);
        expect(nearCacheConfigs['nc-map2'].evictionPolicy).to.equal(Config.EvictionPolicy.LRU);
        expect(nearCacheConfigs['nc-map2'].evictionMaxSize).to.equal(3000);
        expect(nearCacheConfigs['nc-map2'].evictionSamplingCount).to.equal(4);
        expect(nearCacheConfigs['nc-map2'].evictionSamplingPoolSize).to.equal(8);
    });

    it('reliableTopics', function () {
        var rtConfigs = configFull.reliableTopicConfigs;
        expect(rtConfigs['rt1'].name).to.equal('rt1');
        expect(rtConfigs['rt1'].readBatchSize).to.equal(35);
        expect(rtConfigs['rt1'].overloadPolicy).to.equal(Config.TopicOverloadPolicy.DISCARD_NEWEST);

        expect(rtConfigs['rt2'].name).to.equal('rt2');
        expect(rtConfigs['rt2'].readBatchSize).to.equal(15);
        expect(rtConfigs['rt2'].overloadPolicy).to.equal(Config.TopicOverloadPolicy.DISCARD_NEWEST);
    });

    it('listenerConfig', function () {
        var listenerConfig = configFull.listenerConfigs;
        expect(listenerConfig[0].exportedName).to.equal('listener');
        expect(listenerConfig[0].path).to.equal('path/to/file');
        expect(listenerConfig[1].exportedName).to.equal('listener2');
        expect(listenerConfig[1].path).to.equal('path/to/file');
    });

    it('flakeIdGeneratorConfigs', function () {
        var flakeIdConfigs = configFull.flakeIdGeneratorConfigs;
        expect(flakeIdConfigs['flakeid'].name).to.equal('flakeid');
        expect(flakeIdConfigs['flakeid'].prefetchCount).to.equal(123);
        expect(150000).to.be.equal(flakeIdConfigs['flakeid'].prefetchValidityMillis);
        expect(flakeIdConfigs['flakeid2'].name).to.equal('flakeid2');
        expect(flakeIdConfigs['flakeid2'].prefetchCount).to.equal(1234);
        expect(1900000).to.be.equal(flakeIdConfigs['flakeid2'].prefetchValidityMillis);
    })
});
