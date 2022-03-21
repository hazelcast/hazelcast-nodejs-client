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

const { expect, should } = require('chai');
should();
const path = require('path');

const {
    EvictionPolicy,
    JsonStringDeserializationPolicy,
    LoadBalancerType,
    InMemoryFormat,
    TopicOverloadPolicy
} = require('../../../');
const { ConfigBuilder } = require('../../../lib/config/ConfigBuilder');
const { InvalidConfigurationError } = require('../../../lib/core/HazelcastError');
const {
    getSocketAddresses,
    createAddressFromString
} = require('../../../lib/util/AddressUtil');
const { ReconnectMode } = require('../../../lib/config/ConnectionStrategyConfig');
const {TokenEncoding} = require('../../../lib/security/TokenEncoding');

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
        id: 3,
        read: () => {},
        write: () => {}
    };
    const globalSerializer = {
        id: 44,
        read: () => {},
        write: () => {}
    };
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

        const addresses0 = getSocketAddresses(networkCfg.clusterMembers[0]);
        expect(addresses0.primary).to.have.lengthOf(1);
        expect(addresses0.primary[0].host).to.equal('127.0.0.9');
        expect(addresses0.primary[0].port).to.equal(5701);
        expect(addresses0.secondary).to.have.lengthOf(2);
        expect(addresses0.secondary[0].host).to.equal('127.0.0.9');
        expect(addresses0.secondary[0].port).to.equal(5702);
        expect(addresses0.secondary[1].host).to.equal('127.0.0.9');
        expect(addresses0.secondary[1].port).to.equal(5703);

        const addresses1 = getSocketAddresses(networkCfg.clusterMembers[1]);
        expect(addresses0.primary).to.have.lengthOf(1);
        expect(addresses1.primary[0].host).to.equal('127.0.0.2');
        expect(addresses1.primary[0].port).to.equal(5702);
        expect(addresses1.secondary).to.have.lengthOf(0);

        const address0 = createAddressFromString(networkCfg.clusterMembers[0]);
        const address1 = createAddressFromString(networkCfg.clusterMembers[1]);
        expect(address0.host).to.equal('127.0.0.9');
        expect(address0.port).to.equal(-1);
        expect(address1.host).to.equal('127.0.0.2');
        expect(address1.port).to.equal(5702);
        expect(networkCfg.redoOperation).to.be.true;
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
    });

    it('loadBalancer', function () {
        const loadBalancer = fullConfig.loadBalancer;
        expect(loadBalancer.type).to.equal(LoadBalancerType.RANDOM);
        expect(loadBalancer.customLoadBalancer).to.equal(customLoadBalancer);
    });

    it('security', function () {
        const security = fullConfig.security;
        const usernamePasswordCredentials = security.usernamePassword;
        expect(usernamePasswordCredentials.username).to.equal('username');
        expect(usernamePasswordCredentials.password).to.equal('password');
    });
});

describe('ConfigBuilderValidationTest', function () {
    describe('connectionRetryConfig', function () {
        it('should validate initial backoff', function () {
            const invalidValues = [-1, undefined, null, -0.1, [], {}];
            const validValues = [0.1, 1, 12, 123123, 12.2131];
            for (const invalidValue of invalidValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            initialBackoffMillis: invalidValue
                        }
                    }
                }).build()).to.throw(InvalidConfigurationError, 'Initial backoff');
            }
            for (const validValue of validValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            initialBackoffMillis: validValue
                        }
                    }
                }).build()).not.to.throw();
            }
        });

        it('should validate max backoff', function () {
            const invalidValues = [-1, undefined, null, -0.1, [], {}];
            const validValues = [0.1, 1, 12, 123123, 12.2131];
            for (const invalidValue of invalidValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            maxBackoffMillis: invalidValue
                        }
                    }
                }).build()).to.throw(InvalidConfigurationError, 'Max backoff');
            }
            for (const validValue of validValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            maxBackoffMillis: validValue
                        }
                    }
                }).build()).not.to.throw();
            }
        });

        it('should validate multiplier', function () {
            const invalidValues = [-1, undefined, null, -0.1, [], {}, 0.99, 0.21];
            const validValues = [1, 12, 123123, 12.2131];
            for (const invalidValue of invalidValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            multiplier: invalidValue
                        }
                    }
                }).build()).to.throw(InvalidConfigurationError, 'Multiplier');
            }
            for (const validValue of validValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            multiplier: validValue
                        }
                    }
                }).build()).not.to.throw();
            }
        });

        it('should validate cluster connect timeout', function () {
            const invalidValues = [-2, undefined, null, -0.1, [], {}, -13];
            const validValues = [-1, 0.1, 1, 12, 123123, 12.2131, 0];
            for (const invalidValue of invalidValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            clusterConnectTimeoutMillis: invalidValue
                        }
                    }
                }).build()).to.throw(InvalidConfigurationError, 'ClusterConnectTimeoutMillis');
            }
            for (const validValue of validValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            clusterConnectTimeoutMillis: validValue
                        }
                    }
                }).build()).not.to.throw();
            }
        });

        it('should validate jitter', function () {
            const invalidValues = [-1, undefined, null, -0.1, [], {}, 1.01, 123];
            const validValues = [0.1, 0, 0.3, 0.99, 1];
            for (const invalidValue of invalidValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            jitter: invalidValue
                        }
                    }
                }).build()).to.throw(InvalidConfigurationError, 'Jitter');
            }
            for (const validValue of validValues) {
                expect(() => new ConfigBuilder({
                    connectionStrategy: {
                        connectionRetry: {
                            jitter: validValue
                        }
                    }
                }).build()).not.to.throw();
            }
        });
    });

    describe('properties', function () {
        const propsAcceptingNumber = [
            'hazelcast.client.heartbeat.interval',
            'hazelcast.client.heartbeat.timeout',
            'hazelcast.client.invocation.retry.pause.millis',
            'hazelcast.client.invocation.timeout.millis',
            'hazelcast.client.internal.clean.resources.millis',
            'hazelcast.client.statistics.period.seconds',
            'hazelcast.invalidation.reconciliation.interval.seconds',
            'hazelcast.invalidation.max.tolerated.miss.count',
            'hazelcast.invalidation.min.reconciliation.interval.seconds',
            'hazelcast.client.autopipelining.threshold.bytes',
            'hazelcast.client.operation.backup.timeout.millis',
        ];

        const propsAcceptingBoolean = [
            'hazelcast.client.statistics.enabled',
            'hazelcast.client.autopipelining.enabled',
            'hazelcast.client.socket.no.delay',
            'hazelcast.client.shuffle.member.list',
            'hazelcast.client.operation.fail.on.indeterminate.state',
        ];

        const params = [
            ...propsAcceptingNumber.map(p => {
                return {
                    property: p,
                    validValues: [1, 2, 22.2, 122323123, Number.MAX_SAFE_INTEGER],
                    invalidValues: [null, undefined, '1', '2', [], {}]
                };
            }),
            ...propsAcceptingBoolean.map(p => {
                return {
                    property: p,
                    validValues: [true, false],
                    invalidValues: [1, 1.11, null, undefined, '1', '2', [], {}]
                };
            }),
            {
                property: 'hazelcast.client.cloud.url',
                validValues: ['1', 'https://example.org'],
                invalidValues: [1, 1.11, null, undefined, [], {}, true]
            },
            {
                property: 'hazelcast.logging.level',
                validValues: ['OFF', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'],
                invalidValues: [1, 1.11, null, undefined, [], {}, true, 'someOtherString']
            },
            {
                property: 'hazelcast.discovery.public.ip.enabled',
                validValues: [true, false, null],
                invalidValues: [1, 1.11, 'OFF', undefined, '1', '2', [], {}]
            }
        ];

        for (const param of params) {
            it(`should validate "${param.property}"`, function () {
                for (const invalidValue of param.invalidValues) {
                    expect(() => new ConfigBuilder({
                        properties: {
                            [param.property]: invalidValue
                        }
                    }).build()).to.throw(InvalidConfigurationError, 'Property validation error');
                }

                for (const validValue of param.validValues) {
                    expect(() => new ConfigBuilder({
                        properties: {
                            [param.property]: validValue
                        }
                    }).build()).not.to.throw();
                }
            });
        }

        describe('statistics', function () {
            it('should use statistics if both statistics and metrics set enabled', function () {
                expect(new ConfigBuilder({
                    metrics: {
                        enabled: true
                    },
                    properties: {
                        'hazelcast.client.statistics.enabled': false,
                    }
                }).build().metrics.enabled).to.be.false;

                expect(new ConfigBuilder({
                    metrics: {
                        enabled: false
                    },
                    properties: {
                        'hazelcast.client.statistics.enabled': true,
                    }
                }).build().metrics.enabled).to.be.true;

                expect(new ConfigBuilder({
                    metrics: {
                        enabled: true
                    },
                    properties: {
                        'hazelcast.client.statistics.enabled': true,
                    }
                }).build().metrics.enabled).to.be.true;

                expect(new ConfigBuilder({
                    metrics: {
                        enabled: false
                    },
                    properties: {
                        'hazelcast.client.statistics.enabled': false,
                    }
                }).build().metrics.enabled).to.be.false;

                () => new ConfigBuilder({
                    metrics: {
                        collectionFrequencySeconds: 1
                    },
                    properties: {
                        'hazelcast.client.statistics.period.seconds': 2,
                    }
                }).build().metrics.collectionFrequencySeconds.should.be.eq(2);
            });

            it('should behave correctly when statistics properties and metrics setting options', function () {
                const defaultConfig = new ConfigBuilder();

                // uses metrics config by default
                defaultConfig.build().metrics.enabled.should.be.true;
                defaultConfig.build().metrics.collectionFrequencySeconds.should.be.eq(5);

                new ConfigBuilder({
                    metrics: {
                        enabled: true
                    }
                }).build().metrics.enabled.should.be.true;

                new ConfigBuilder({
                    properties: {
                        'hazelcast.client.statistics.enabled': true,
                    }
                }).build().metrics.enabled.should.be.true;

                new ConfigBuilder({
                    metrics: {
                        enabled: false
                    }
                }).build().metrics.enabled.should.be.false;

                new ConfigBuilder({
                    properties: {
                        'hazelcast.client.statistics.enabled': false,
                    }
                }).build().metrics.enabled.should.be.false;

                new ConfigBuilder({
                    metrics: {
                        collectionFrequencySeconds: 999
                    }
                }).build().metrics.collectionFrequencySeconds.should.be.eq(999);

                new ConfigBuilder({
                    properties: {
                        'hazelcast.client.statistics.period.seconds': 999,
                    }
                }).build().metrics.collectionFrequencySeconds.should.be.eq(999);
            });

            it('should throw error on non-positive frequency', function () {
                [-1, 0].forEach(frequency => {
                    expect(() => new ConfigBuilder({
                        metrics: {
                            collectionFrequencySeconds: frequency
                        }
                    }).build()).to.throw(InvalidConfigurationError, 'must be positive');
                });
            });
        });
    });

    describe('networkConfig', function () {
       it('should validate sslOptionsFactory', function () {
           const invalidSSLFactories = [() => {}, 1, '1', {
               init: () => {}
           }];

           for (const invalidSSLFactory of invalidSSLFactories) {
               expect(() => new ConfigBuilder({
                   network: {
                       ssl: {
                           enabled: true,
                           sslOptionsFactory: invalidSSLFactory,
                           sslOptionsFactoryProperties: {}
                       }
                   }
               }).build()).to.throw(InvalidConfigurationError, 'Invalid SSLOptionsFactory given');
           }

           const validFactory = {
               init: () => {},
               getSSLOptions: () => {}
           };

           expect(() => new ConfigBuilder({
               network: {
                   ssl: {
                       enabled: true,
                       sslOptionsFactory: validFactory,
                       sslOptionsFactoryProperties: {}
                   }
               }
           }).build()).not.to.throw();
       });
    });

    describe('loadBalancerConfig', function () {
        it('should validate custom load balancer config', function () {
            const invalidCustomLoadBalancers = [
                () => {}, 1, undefined, '1', { initLoadBalancer: () => {}}, { next: () => {} }
            ];

            for (const invalidCustomLoadBalancer of invalidCustomLoadBalancers) {
                expect(() => new ConfigBuilder({
                    loadBalancer: {
                        customLoadBalancer: invalidCustomLoadBalancer
                    }
                }).build()).to.throw(InvalidConfigurationError, 'Invalid LoadBalancer given');
            }

            const validCustomLoadBalancer = {
                initLoadBalancer: () => {},
                next: () => {}
            };

            expect(() => new ConfigBuilder({
                loadBalancer: {
                    customLoadBalancer: validCustomLoadBalancer
                }
            }).build()).not.to.throw();
        });
    });

    describe('serialization', function () {
        it('should validate portable and data serializable factories', function () {
            const invalidFactoriesArray = [
                () => {}, 1, undefined, '1', { aaasd: () => {}}, { 1.1: () => {}, 2: () => {} }
            ];

            for (const invalidFactories of invalidFactoriesArray) {
                expect(() => new ConfigBuilder({
                    serialization: {
                        portableFactories: invalidFactories
                    }
                }).build()).to.throw(InvalidConfigurationError, 'portable');

                expect(() => new ConfigBuilder({
                    serialization: {
                        dataSerializableFactories: invalidFactories
                    }
                }).build()).to.throw(InvalidConfigurationError, 'dataSerializable');
            }

            const validFactories = {
                1: () => {},
                2: () => {}
            };

            expect(() => new ConfigBuilder({
                serialization: {
                    portableFactories: validFactories
                }
            }).build()).not.to.throw();

            expect(() => new ConfigBuilder({
                serialization: {
                    dataSerializableFactories: validFactories
                }
            }).build()).not.to.throw();
        });

        it('should validate custom serializers', function () {
            const invalidCustomSerializersArray = [
                () => {}, 1, undefined, '1', { initLoadBalancer: () => {}}, [{
                    read: () => {},
                    write: () => {}
                }],
                [{
                    id: 1,
                    write: () => {},
                    read: null
                }],
                [{
                    id: null,
                    write: () => {},
                    read: () => {}
                },
                {
                    id: 1,
                    read: () => {},
                    write: null
                }]
            ];

            for (const invalidCustomSerializers of invalidCustomSerializersArray) {
                expect(() => new ConfigBuilder({
                    serialization: {
                        customSerializers: invalidCustomSerializers
                    }
                }).build()).to.throw(InvalidConfigurationError, /(not an array|Invalid custom serializer)/);
            }

            const validCustomSerializers = [
                {
                    id: 1,
                    read: () => {},
                    write: () => {}
                },
                {
                    id: 1,
                    read: () => {},
                    write: () => {}
                }
            ];

            expect(() => new ConfigBuilder({
                serialization: {
                    customSerializers: validCustomSerializers
                }
            }).build()).not.to.throw();
        });

        it('should validate compact serializers', function () {
            const invalidCompactSerializersArray = [
                () => {}, 1, undefined, '1', { read: () => {}, write: () => {}, class: class {}}, [{
                    read: () => {},
                    write: () => {}
                }],
                [{
                    write: () => {}
                }],
                [{
                    read: () => {}
                }],
                [{
                    class: class A {},
                    read: () => {},
                    write: () => {}
                }],
                [{
                    class: class A {},
                    prop: 1,
                    read: () => {},
                    write: () => {}
                }],
            ];

            for (const invalidCompactSerializers of invalidCompactSerializersArray) {
                expect(() => new ConfigBuilder({
                    serialization: {
                        compact:{
                            serializers: invalidCompactSerializers
                        }
                    }
                }).build()).to.throw(InvalidConfigurationError, /(not an array|Invalid compact serializer)/);
            }

            const validCompactSerializers = [
                {
                    typeName: 's',
                    class: class A {},
                    read: () => {},
                    write: () => {}
                },
                {
                    prop: 1,
                    typeName: 's',
                    class: class A {},
                    read: () => {},
                    write: () => {}
                }
            ];

            expect(() => new ConfigBuilder({
                serialization: {
                    compact: {
                        serializers: validCompactSerializers
                    }
                }
            }).build()).not.to.throw();
        });

        it('should validate the global serializer', function () {
            const invalidGlobalSerializers = [
                () => {}, 1, undefined, '1', { initLoadBalancer: () => {}}, { read: () => {}, write: () => {} },
                { id: 1, write: () => {} }, {}
            ];

            for (const invalidGlobalSerializer of invalidGlobalSerializers) {
                expect(() => new ConfigBuilder({
                    serialization: {
                        globalSerializer: invalidGlobalSerializer
                    }
                }).build()).to.throw(InvalidConfigurationError, 'Invalid global serializer');
            }

            const validGlobalSerializer = {
                id: 1,
                read: () => {},
                write: () => {}
            };

            expect(() => new ConfigBuilder({
                serialization: {
                    globalSerializer: validGlobalSerializer
                }
            }).build()).not.to.throw();
        });
    });

    it('should validate lifecycleListeners', function () {
        const invalidLifecycleListenersArray = [undefined, 1, '1', {}, [1], [() => {}, 1]];

        for (const invalidLifecycleListeners of invalidLifecycleListenersArray) {
            expect(() => new ConfigBuilder({
                lifecycleListeners: invalidLifecycleListeners
            }).build()).to.throw(InvalidConfigurationError, /(Lifecycle listener|not an array)/);
        }

        const validLifecycleListeners = [() => {}, () => {}];

        expect(() => new ConfigBuilder({
            lifecycleListeners: validLifecycleListeners
        }).build()).not.to.throw();
    });

    it('should validate membershipListeners', function () {
        const invalidMembershipListenersArray = [undefined, 1, '1', {}, [1], [{}]];

        for (const invalidMembershipListeners of invalidMembershipListenersArray) {
            expect(() => new ConfigBuilder({
                membershipListeners: invalidMembershipListeners
            }).build()).to.throw(InvalidConfigurationError, /(membershipListener|not an array)/);
        }

        const validMembershipListeners = [{memberAdded: () => {}}, {memberAdded: () => {}, memberRemoved: () => {}}];

        expect(() => new ConfigBuilder({
            membershipListeners: validMembershipListeners
        }).build()).not.to.throw();
    });

    it('should validate custom logger', function () {
        const invalidCustomLoggers = [undefined, 1, '1', {}, [1], [{}], {log: () => {}, error: () => {}}];

        for (const invalidLogger of invalidCustomLoggers) {
            expect(() => new ConfigBuilder({
                customLogger: invalidLogger
            }).build()).to.throw(InvalidConfigurationError, 'custom logger');
        }

        const validCustomLogger = {
            log: () => {}, error: () => {}, warn: () => {}, info: () => {}, debug: () => {},
            trace: () => {}
        };

        expect(() => new ConfigBuilder({
            customLogger: validCustomLogger
        }).build()).not.to.throw();
    });

    it('should throw InvalidConfigurationError when invalid top level config key is passed', function () {
        expect(() => new ConfigBuilder({
            a: 1
        }).build()).to.throw(InvalidConfigurationError, 'Unexpected config key');
    });

    it('should throw InvalidConfigurationError when invalid network config key is passed', function () {
        expect(() => new ConfigBuilder({
            network: {
                a: 1
            }
        }).build()).to.throw(InvalidConfigurationError, 'Unexpected network option');
    });

    it('should throw InvalidConfigurationError when invalid connectionStrategy config key is passed', function () {
        expect(() => new ConfigBuilder({
            connectionStrategy: {
                a: 1
            }
        }).build()).to.throw(InvalidConfigurationError, 'Unexpected connection strategy config');
    });

    it('should throw InvalidConfigurationError when invalid loadBalancer config key is passed', function () {
        expect(() => new ConfigBuilder({
            loadBalancer: {
                a: 1
            }
        }).build()).to.throw(InvalidConfigurationError, 'Unexpected load balancer config');
    });

    it('should throw InvalidConfigurationError when invalid serialization config key is passed', function () {
        expect(() => new ConfigBuilder({
            serialization: {
                a: 1
            }
        }).build()).to.throw(InvalidConfigurationError, 'Unexpected serialization config');
    });

    it('should throw InvalidConfigurationError when invalid distributed objects config key is passed', function () {
        expect(() => new ConfigBuilder({
            nearCaches: [
                {
                    nearCache1: {
                        a: 1
                    }
                }
            ]
        }).build()).to.throw(InvalidConfigurationError, 'Unexpected near cache config');

        expect(() => new ConfigBuilder({
            reliableTopics: [
                {
                    reliableTopic1: {
                        a: 1
                    }
                }
            ]
        }).build()).to.throw(InvalidConfigurationError, 'Unexpected reliable topic config');

        expect(() => new ConfigBuilder({
            flakeIdGenerators: [
                {
                    flakeIdGenerator1: {
                        a: 1
                    }
                }
            ]
        }).build()).to.throw(InvalidConfigurationError, 'Unexpected flake id generator config');
    });

    it('should validate security config', function () {
        const invalidConfigs = [
            {
                'security': {
                    'somethingElse': false
                }
            },
            {
                'security': {
                    'usernamePassword': {
                        'username': false,
                        'password': 'password'
                    }
                }
            },
            {
                'security': {
                    'usernamePassword': {
                        'username': 'username',
                        'password': false
                    }
                }
            },
            {
                'security': {
                    'usernamePassword': {
                        'username': 'username',
                        'password': 'password',
                        'extraField': true
                    }
                }
            },
            {
                'security': {
                    'token': {
                        'token': 'token',
                        'encoding': 'not-a-valid-encoding'
                    }
                }
            },
            {
                'security': {
                    'token': {
                        'token': 123,
                        'encoding': TokenEncoding.ASCII
                    }
                }
            },
            {
                'security': {
                    'token': {
                        'token': 'token',
                        'encoding': 123
                    }
                }
            },
            // token field is mandatory
            {
                'security': {
                    'token': {
                        'encoding': TokenEncoding.ASCII
                    }
                }
            },
            {
                'security': {
                    'token': {
                        'token': 'token',
                        'encoding': TokenEncoding.ASCII,
                        'extraField': true
                    }
                }
            }
        ];

        for (const config of invalidConfigs) {
            expect(() => new ConfigBuilder(config).build()).to.throw(InvalidConfigurationError);
        }
    });

    it('should throw when customCredentials and security are used together', function () {
        expect(() => new ConfigBuilder({
            'customCredentials': {},
            'security': {
                'username': {
                    'username': 'username',
                    'password': 'password',
                }
            }
        }).build()).to.throw(InvalidConfigurationError, 'Ambiguous security configuration is found');
    });

    it('should throw when multiple security configurations are used together', function () {
        const invalidConfigs = [
            {
                'security': {
                    'usernamePassword': {
                        'username': 'username',
                        'password': 'password',
                    },
                    'token': {
                        'token': 'token',
                    }
                }
            },
            {
                'security': {
                    'usernamePassword': {
                        'username': 'username',
                        'password': 'password',
                    },
                    'custom': {
                        'field': 'value',
                    }
                }
            },
            {
                'security': {
                    'token': {
                        'token': 'token',
                    },
                    'custom': {
                        'field': 'value',
                    }
                }
            },
            {
                'security': {
                    'usernamePassword': {
                        'username': 'username',
                        'password': 'password',
                    },
                    'token': {
                        'token': 'token',
                    },
                    'custom': {
                        'field': 'value',
                    }
                }
            }
        ];

        for (const config of invalidConfigs) {
            expect(() => new ConfigBuilder(config).build()).to.throw(InvalidConfigurationError, 'Multiple credential types');
        }
    });
});
