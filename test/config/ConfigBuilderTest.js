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
const path = require('path');
const {
    EvictionPolicy,
    JsonStringDeserializationPolicy,
    LoadBalancerType,
    InMemoryFormat,
    TopicOverloadPolicy,
} = require('../..');
const { ConfigBuilder } = require('../../lib/config/ConfigBuilder');
const { AddressHelper } = require('../../lib/util/Util');
const { ReconnectMode } = require('../../lib/config/ConnectionStrategyConfig');

describe('ConfigBuilderTest', function () {

    let fullConfig;
    const lifecycleListener = () => {};
    const membershipListener = {
        memberAdded: () => {},
        memberRemoved: () => {}
    };
    const dataSerializableFactory = () => {};
    const portableFactory = () => {};
    const customSerializer = {
        id: 3
    };
    const globalSerializer = {};
    const customLoadBalancer = {
        initLoadBalancer: () => {},
        next: () => {}
    };

    before(function () {
        const inputConfig = require(path.join(__dirname, 'configurations/full.json'));
        inputConfig.lifecycleListeners = [
            lifecycleListener
        ];
        inputConfig.membershipListeners = [
            membershipListener
        ];
        inputConfig.serialization.dataSerializableFactories = {
            1: dataSerializableFactory
        };
        inputConfig.serialization.portableFactories = {
            2: portableFactory
        };
        inputConfig.serialization.customSerializers = [customSerializer];
        inputConfig.serialization.globalSerializer = globalSerializer;
        inputConfig.loadBalancer.customLoadBalancer = customLoadBalancer;
        fullConfig = new ConfigBuilder(inputConfig).build();
    });

    it('clusterName', function () {
        expect(fullConfig.clusterName).to.equal('testCluster');
    });

    it('instanceName', function () {
        expect(fullConfig.instanceName).to.equal('clientName');
    });

    it('clientLabels', function () {
        const labels = fullConfig.clientLabels;
        expect(labels.length).to.equal(2);
        expect(labels.includes('label1')).to.be.true;
        expect(labels.includes('label2')).to.be.true;
    });

    it('connectionStrategy', function () {
        const connectionStrategyConfig = fullConfig.connectionStrategy;
        expect(connectionStrategyConfig.asyncStart).to.be.true;
        expect(connectionStrategyConfig.reconnectMode).to.equal(ReconnectMode.ASYNC);

        const connectionRetryConfig = connectionStrategyConfig.connectionRetry;
        expect(connectionRetryConfig.initialBackoffMillis).to.equal(2000);
        expect(connectionRetryConfig.maxBackoffMillis).to.equal(60000);
        expect(connectionRetryConfig.multiplier).to.equal(3);
        expect(connectionRetryConfig.clusterConnectTimeoutMillis).to.equal(5000);
        expect(connectionRetryConfig.jitter).to.equal(0.5);
    });

    it('network', function () {
        const networkCfg = fullConfig.network;

        const addresses0 = AddressHelper.getSocketAddresses(networkCfg.clusterMembers[0]);
        expect(addresses0[0].host).to.equal('127.0.0.9');
        expect(addresses0[0].port).to.equal(5701);
        expect(addresses0[1].host).to.equal('127.0.0.9');
        expect(addresses0[1].port).to.equal(5702);
        expect(addresses0[2].host).to.equal('127.0.0.9');
        expect(addresses0[2].port).to.equal(5703);
        expect(addresses0.length).to.equal(3);

        const addresses1 = AddressHelper.getSocketAddresses(networkCfg.clusterMembers[1]);
        expect(addresses1[0].host).to.equal('127.0.0.2');
        expect(addresses1[0].port).to.equal(5702);
        expect(addresses1.length).to.equal(1);

        const address0 = AddressHelper.createAddressFromString(networkCfg.clusterMembers[0]);
        const address1 = AddressHelper.createAddressFromString(networkCfg.clusterMembers[1]);
        expect(address0.host).to.equal('127.0.0.9');
        expect(address0.port).to.be.undefined;
        expect(address1.host).to.equal('127.0.0.2');
        expect(address1.port).to.equal(5702);
        expect(networkCfg.smartRouting).to.be.false;
        expect(networkCfg.connectionTimeout).to.equal(6000);
        expect(networkCfg.ssl.enabled).to.be.true;
        expect(networkCfg.ssl.sslOptions).to.be.not.null;
        expect(networkCfg.ssl.sslOptions.ca).to.equal('ca.pem');
        expect(networkCfg.ssl.sslOptions.cert).to.equal('cert.pem');
        expect(networkCfg.ssl.sslOptions.key).to.equal('key.pem');
        expect(networkCfg.ssl.sslOptions.servername).to.equal('foo.bar.com');
    });

    it('backupAckToClientEnabled', function () {
        expect(fullConfig.backupAckToClientEnabled).to.be.false;
    });

    it('properties', function () {
        const properties = fullConfig.properties;
        expect(properties['hazelcast.client.heartbeat.interval']).to.equal(1000);
        expect(properties['hazelcast.client.heartbeat.timeout']).to.equal(10000);
        expect(properties['hazelcast.client.invocation.retry.pause.millis']).to.equal(4000);
        expect(properties['hazelcast.client.invocation.timeout.millis']).to.equal(180000);
        expect(properties['hazelcast.client.cloud.url']).to.equal('https://hz.cloud');
        expect(properties['hazelcast.client.statistics.enabled']).to.be.true;
        expect(properties['hazelcast.client.statistics.period.seconds']).to.be.equal(4);
        expect(properties['hazelcast.invalidation.reconciliation.interval.seconds']).equal(50);
        expect(properties['hazelcast.invalidation.max.tolerated.miss.count']).to.equal(15);
        expect(properties['hazelcast.invalidation.min.reconciliation.interval.seconds']).to.equal(60);
        expect(properties['hazelcast.logging.level']).to.be.equal('OFF');
        expect(properties['hazelcast.client.autopipelining.enabled']).to.be.false;
        expect(properties['hazelcast.client.autopipelining.threshold.bytes']).to.equal(1024);
        expect(properties['hazelcast.client.socket.no.delay']).to.be.false;
        expect(properties['hazelcast.client.shuffle.member.list']).to.be.false;
    });

    it('serialization', function () {
        const serializationCfg = fullConfig.serialization;

        expect(serializationCfg.defaultNumberType).to.equal('integer');
        expect(serializationCfg.isBigEndian).to.equal(false);
        expect(serializationCfg.portableVersion).to.equal(1);
        expect(serializationCfg.jsonStringDeserializationPolicy)
            .to.equal(JsonStringDeserializationPolicy.NO_DESERIALIZATION);

        expect(Object.keys(serializationCfg.dataSerializableFactories).length).to.equal(1);
        expect(serializationCfg.dataSerializableFactories['1']).to.equal(dataSerializableFactory);

        expect(Object.keys(serializationCfg.portableFactories).length).to.equal(1);
        expect(serializationCfg.portableFactories['2']).to.equal(portableFactory);

        expect(serializationCfg.customSerializers.length).to.equal(1);
        expect(serializationCfg.customSerializers[0]).to.equal(customSerializer);

        expect(serializationCfg.globalSerializer).to.equal(globalSerializer);
    });

    it('nearCaches', function () {
        const nearCacheConfigs = fullConfig.nearCaches;
        expect(nearCacheConfigs['nc-map'].name).to.equal('nc-map');
        expect(nearCacheConfigs['nc-map'].invalidateOnChange).to.be.false;
        expect(nearCacheConfigs['nc-map'].maxIdleSeconds).to.equal(2);
        expect(nearCacheConfigs['nc-map'].inMemoryFormat).to.equal(InMemoryFormat.OBJECT);
        expect(nearCacheConfigs['nc-map'].timeToLiveSeconds).to.equal(3);
        expect(nearCacheConfigs['nc-map'].evictionPolicy).to.equal(EvictionPolicy.LRU);
        expect(nearCacheConfigs['nc-map'].evictionMaxSize).to.equal(3000);
        expect(nearCacheConfigs['nc-map'].evictionSamplingCount).to.equal(4);
        expect(nearCacheConfigs['nc-map'].evictionSamplingPoolSize).to.equal(8);

        expect(nearCacheConfigs['nc-map2'].name).to.equal('nc-map2');
        expect(nearCacheConfigs['nc-map2'].invalidateOnChange).to.be.false;
        expect(nearCacheConfigs['nc-map2'].maxIdleSeconds).to.equal(2);
        expect(nearCacheConfigs['nc-map2'].inMemoryFormat).to.equal(InMemoryFormat.OBJECT);
        expect(nearCacheConfigs['nc-map2'].timeToLiveSeconds).to.equal(3);
        expect(nearCacheConfigs['nc-map2'].evictionPolicy).to.equal(EvictionPolicy.LRU);
        expect(nearCacheConfigs['nc-map2'].evictionMaxSize).to.equal(3000);
        expect(nearCacheConfigs['nc-map2'].evictionSamplingCount).to.equal(4);
        expect(nearCacheConfigs['nc-map2'].evictionSamplingPoolSize).to.equal(8);
    });

    it('reliableTopics', function () {
        const rtConfigs = fullConfig.reliableTopics;
        expect(rtConfigs['rt1'].name).to.equal('rt1');
        expect(rtConfigs['rt1'].readBatchSize).to.equal(35);
        expect(rtConfigs['rt1'].overloadPolicy).to.equal(TopicOverloadPolicy.DISCARD_NEWEST);

        expect(rtConfigs['rt2'].name).to.equal('rt2');
        expect(rtConfigs['rt2'].readBatchSize).to.equal(15);
        expect(rtConfigs['rt2'].overloadPolicy).to.equal(TopicOverloadPolicy.DISCARD_NEWEST);
    });

    it('lifecycleListeners', function () {
        const listenerConfig = fullConfig.lifecycleListeners;
        expect(listenerConfig.length).to.equal(1);
        expect(listenerConfig[0]).to.equal(lifecycleListener);
    });

    it('membershipListeners', function () {
        const listenerConfig = fullConfig.membershipListeners;
        expect(listenerConfig.length).to.equal(1);
        expect(listenerConfig[0]).to.equal(membershipListener);
    });

    it('flakeIdGenerators', function () {
        const flakeIdConfigs = fullConfig.flakeIdGenerators;
        expect(flakeIdConfigs['flakeid'].name).to.equal('flakeid');
        expect(flakeIdConfigs['flakeid'].prefetchCount).to.equal(123);
        expect(150000).to.be.equal(flakeIdConfigs['flakeid'].prefetchValidityMillis);
        expect(flakeIdConfigs['flakeid2'].name).to.equal('flakeid2');
        expect(flakeIdConfigs['flakeid2'].prefetchCount).to.equal(1234);
        expect(1900000).to.be.equal(flakeIdConfigs['flakeid2'].prefetchValidityMillis);
    })

    it('loadBalancer', function () {
        const loadBalancer = fullConfig.loadBalancer;
        expect(loadBalancer.type).to.equal(LoadBalancerType.RANDOM);
        expect(loadBalancer.customLoadBalancer).to.equal(customLoadBalancer);
    });
});
