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

import * as Promise from 'bluebird';
import {BasicSSLOptionsFactory} from '../connection/BasicSSLOptionsFactory';
import {HazelcastError} from '../HazelcastError';
import {TopicOverloadPolicy} from '../proxy/topic/TopicOverloadPolicy';
import {loadNameFromPath, mergeJson, tryGetArray, tryGetBoolean, tryGetEnum, tryGetNumber, tryGetString} from '../Util';
import {ClientConfig} from './Config';
import {EvictionPolicy} from './EvictionPolicy';
import {FlakeIdGeneratorConfig} from './FlakeIdGeneratorConfig';
import {ImportConfig} from './ImportConfig';
import {InMemoryFormat} from './InMemoryFormat';
import {JsonConfigLocator} from './JsonConfigLocator';
import {NearCacheConfig} from './NearCacheConfig';
import {Properties} from './Properties';
import {ReliableTopicConfig} from './ReliableTopicConfig';
import {JsonStringDeserializationPolicy} from './JsonStringDeserializationPolicy';
import {StringSerializationPolicy} from './StringSerializationPolicy';

export class ConfigBuilder {
    private clientConfig: ClientConfig = new ClientConfig();
    private loadedJson: any;
    private configLocator: JsonConfigLocator = new JsonConfigLocator();

    loadConfig(): Promise<void> {
        return this.configLocator.load().then(() => {
            const loadedBuffer = this.configLocator.getBuffer();
            if (loadedBuffer) {
                this.loadedJson = JSON.parse(loadedBuffer.toString());
                return this.replaceImportsWithContent(this.loadedJson);
            }
        });
    }

    build(): ClientConfig {
        try {
            this.handleConfig(this.loadedJson);
            return this.clientConfig;
        } catch (e) {
            throw new HazelcastError('Error parsing config: ' + e.message, e);
        }
    }

    private replaceImportsWithContent(jsonObject: any): Promise<void> {
        if (jsonObject.import) {
            const includes = tryGetArray(jsonObject.import);
            return Promise.map(includes, (path: string) => {
                return this.configLocator.loadImported(path);
            }).map((buffer: Buffer) => {
                mergeJson(jsonObject, JSON.parse(buffer.toString()));
            }).return();
        }
    }

    private handleConfig(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'network') {
                this.handleNetwork(jsonObject[key]);
            } else if (key === 'group') {
                this.handleGroup(jsonObject[key]);
            } else if (key === 'properties') {
                this.handleProperties(jsonObject[key]);
            } else if (key === 'listeners') {
                this.handleListeners(jsonObject[key]);
            } else if (key === 'serialization') {
                this.handleSerialization(jsonObject[key]);
            } else if (key === 'nearCaches') {
                this.handleNearCaches(jsonObject[key]);
            } else if (key === 'reliableTopics') {
                this.handleReliableTopics(jsonObject[key]);
            } else if (key === 'flakeIdGeneratorConfigs') {
                this.handleFlakeIds(jsonObject[key]);
            }
        }
    }

    private handleNetwork(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'clusterMembers') {
                this.handleClusterMembers(jsonObject[key]);
            } else if (key === 'smartRouting') {
                this.clientConfig.networkConfig.smartRouting = tryGetBoolean(jsonObject[key]);
            } else if (key === 'connectionTimeout') {
                this.clientConfig.networkConfig.connectionTimeout = tryGetNumber(jsonObject[key]);
            } else if (key === 'connectionAttemptPeriod') {
                this.clientConfig.networkConfig.connectionAttemptPeriod = tryGetNumber(jsonObject[key]);
            } else if (key === 'connectionAttemptLimit') {
                this.clientConfig.networkConfig.connectionAttemptLimit = tryGetNumber(jsonObject[key]);
            } else if (key === 'ssl') {
                this.handleSSL(jsonObject[key]);
            } else if (key === 'hazelcastCloud') {
                this.handleHazelcastCloud(jsonObject[key]);
            }
        }
    }

    private handleHazelcastCloud(jsonObject: any): void {
        const cloudConfigEnabled = tryGetBoolean(jsonObject.enabled);
        if (cloudConfigEnabled) {
            this.clientConfig.networkConfig.cloudConfig.enabled = cloudConfigEnabled;
        }
        for (const key in jsonObject) {
            if (key === 'discoveryToken') {
                this.clientConfig.networkConfig.cloudConfig.discoveryToken = tryGetString(jsonObject[key]);
            }
        }
    }

    private parseProperties(jsonObject: any): Properties {
        const props: Properties = {} as Properties;
        for (const key in jsonObject) {
            props[key] = jsonObject[key];
        }
        return props;
    }

    private parseImportConfig(jsonObject: any): ImportConfig {
        const importConfig: ImportConfig = {} as ImportConfig;
        importConfig.path = jsonObject.path;
        importConfig.exportedName = jsonObject.exportedName;
        return importConfig;
    }

    private handleSSL(jsonObject: any): void {
        const sslEnabled = tryGetBoolean(jsonObject.enabled);
        this.clientConfig.networkConfig.sslConfig.enabled = sslEnabled;

        if (jsonObject.sslOptions) {
            if (jsonObject.factory) {
                throw new RangeError('Invalid configuration. Either SSL options should be set manually or SSL factory' +
                    ' should be used.');
            }
            this.clientConfig.networkConfig.sslConfig.sslOptions = jsonObject.sslOptions;
        } else if (jsonObject.factory) {
            const factoryObj = jsonObject.factory;
            const importConfig = this.parseImportConfig(factoryObj);
            if (importConfig.path == null && importConfig.exportedName !== BasicSSLOptionsFactory.name) {
                throw new RangeError('Invalid configuration. Either SSL factory path should be set or exportedName' +
                    ' should be ' + BasicSSLOptionsFactory.name + '.');
            } else {
                let factory;
                if (importConfig.path) {
                    const factoryConstructor = loadNameFromPath(importConfig.path, importConfig.exportedName);
                    factory = new factoryConstructor();
                } else {
                    factory = new BasicSSLOptionsFactory();
                }
                this.clientConfig.networkConfig.sslConfig
                    .sslOptionsFactory = factory;
                this.clientConfig.networkConfig.sslConfig
                    .sslOptionsFactoryProperties = this.parseProperties(factoryObj.properties);
            }
        }
    }

    private handleClusterMembers(jsonObject: any): void {
        const addressArray = tryGetArray(jsonObject);
        for (const index in addressArray) {
            const address = addressArray[index];
            this.clientConfig.networkConfig.addresses.push(tryGetString(address));
        }
    }

    private handleGroup(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'name') {
                this.clientConfig.groupConfig.name = tryGetString(jsonObject[key]);
            } else if (key === 'password') {
                this.clientConfig.groupConfig.password = tryGetString(jsonObject[key]);
            }
        }
    }

    private handleProperties(jsonObject: any): void {
        for (const key in jsonObject) {
            this.clientConfig.properties[key] = jsonObject[key];
        }
    }

    private handleListeners(jsonObject: any): void {
        const listenersArray = tryGetArray(jsonObject);
        for (const index in listenersArray) {
            const listenerObj = listenersArray[index];
            const importConfig = this.parseImportConfig(listenerObj);
            const listener = loadNameFromPath(importConfig.path, importConfig.exportedName);
            this.clientConfig.listeners.lifecycle.push(listener);
        }
    }

    private handleSerialization(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'defaultNumberType') {
                this.clientConfig.serializationConfig.defaultNumberType = tryGetString(jsonObject[key]);
            } else if (key === 'isBigEndian') {
                this.clientConfig.serializationConfig.isBigEndian = tryGetBoolean(jsonObject[key]);
            } else if (key === 'portableVersion') {
                this.clientConfig.serializationConfig.portableVersion = tryGetNumber(jsonObject[key]);
            } else if (key === 'dataSerializableFactories') {
                for (const index in jsonObject[key]) {
                    const factoryObj = jsonObject[key][index];
                    const importConfig = this.parseImportConfig(factoryObj);
                    const factoryConstructor = loadNameFromPath(importConfig.path, importConfig.exportedName);
                    this.clientConfig.serializationConfig
                        .dataSerializableFactories[factoryObj.factoryId] = new factoryConstructor();
                }
            } else if (key === 'portableFactories') {
                for (const index in jsonObject[key]) {
                    const factoryObj = jsonObject[key][index];
                    const importConfig = this.parseImportConfig(factoryObj);
                    const factoryConstructor = loadNameFromPath(importConfig.path, importConfig.exportedName);
                    this.clientConfig.serializationConfig
                        .portableFactories[factoryObj.factoryId] = new factoryConstructor();
                }
            } else if (key === 'globalSerializer') {
                const globalSerializerObj = jsonObject[key];
                const importConfig = this.parseImportConfig(globalSerializerObj);
                const globalSerializerConstructor = loadNameFromPath(importConfig.path, importConfig.exportedName);
                this.clientConfig.serializationConfig.globalSerializer = new globalSerializerConstructor();
            } else if (key === 'serializers') {
                this.handleSerializers(jsonObject[key]);
            } else if (key === 'jsonStringDeserializationPolicy') {
                this.clientConfig.serializationConfig
                    .jsonStringDeserializationPolicy = tryGetEnum(JsonStringDeserializationPolicy, jsonObject[key]);
            } else if (key === 'stringSerializationPolicy') {
                this.clientConfig.serializationConfig
                    .stringSerializationPolicy = tryGetEnum(StringSerializationPolicy, jsonObject[key]);
            }
        }
    }

    private handleSerializers(jsonObject: any): void {
        const serializersArray = tryGetArray(jsonObject);
        for (const index in serializersArray) {
            const serializerObj = serializersArray[index];
            const importConfig = this.parseImportConfig(serializerObj);
            const serializerConstructor = loadNameFromPath(importConfig.path, importConfig.exportedName);
            this.clientConfig.serializationConfig
                .customSerializers[serializerObj.typeId] = new serializerConstructor();
        }
    }

    private handleNearCaches(jsonObject: any): void {
        const nearCachesArray = tryGetArray(jsonObject);
        for (const index in nearCachesArray) {
            const ncConfig = nearCachesArray[index];
            const nearCacheConfig = new NearCacheConfig();
            for (const name in ncConfig) {
                if (name === 'name') {
                    nearCacheConfig.name = tryGetString(ncConfig[name]);
                } else if (name === 'invalidateOnChange') {
                    nearCacheConfig.invalidateOnChange = tryGetBoolean(ncConfig[name]);
                } else if (name === 'maxIdleSeconds') {
                    nearCacheConfig.maxIdleSeconds = tryGetNumber(ncConfig[name]);
                } else if (name === 'inMemoryFormat') {
                    nearCacheConfig.inMemoryFormat = tryGetEnum(InMemoryFormat, ncConfig[name]);
                } else if (name === 'timeToLiveSeconds') {
                    nearCacheConfig.timeToLiveSeconds = tryGetNumber(ncConfig[name]);
                } else if (name === 'evictionPolicy') {
                    nearCacheConfig.evictionPolicy = tryGetEnum(EvictionPolicy, ncConfig[name]);
                } else if (name === 'evictionMaxSize') {
                    nearCacheConfig.evictionMaxSize = tryGetNumber(ncConfig[name]);
                } else if (name === 'evictionSamplingCount') {
                    nearCacheConfig.evictionSamplingCount = tryGetNumber(ncConfig[name]);
                } else if (name === 'evictionSamplingPoolSize') {
                    nearCacheConfig.evictionSamplingPoolSize = tryGetNumber(ncConfig[name]);
                }
            }
            this.clientConfig.nearCacheConfigs[nearCacheConfig.name] = nearCacheConfig;
        }
    }

    private handleReliableTopics(jsonObject: any): void {
        const rtConfigsArray = tryGetArray(jsonObject);
        for (const index in rtConfigsArray) {
            const jsonRtCfg = rtConfigsArray[index];
            const reliableTopicConfig = new ReliableTopicConfig();
            for (const name in jsonRtCfg) {
                if (name === 'name') {
                    reliableTopicConfig.name = jsonRtCfg[name];
                } else if (name === 'readBatchSize') {
                    reliableTopicConfig.readBatchSize = jsonRtCfg[name];
                } else if (name === 'overloadPolicy') {
                    reliableTopicConfig.overloadPolicy = tryGetEnum(TopicOverloadPolicy, jsonRtCfg[name]);
                }
            }
            this.clientConfig.reliableTopicConfigs[reliableTopicConfig.name] = reliableTopicConfig;
        }
    }

    private handleFlakeIds(jsonObject: any): void {
        const flakeIdsArray = tryGetArray(jsonObject);
        for (const index in flakeIdsArray) {
            const fidConfig = flakeIdsArray[index];
            const flakeIdConfig = new FlakeIdGeneratorConfig();
            for (const name in fidConfig) {
                if (name === 'name') {
                    flakeIdConfig.name = tryGetString(fidConfig[name]);
                } else if (name === 'prefetchCount') {
                    flakeIdConfig.prefetchCount = tryGetNumber(fidConfig[name]);
                } else if (name === 'prefetchValidityMillis') {
                    flakeIdConfig.prefetchValidityMillis = tryGetNumber(fidConfig[name]);
                }
            }
            this.clientConfig.flakeIdGeneratorConfigs[flakeIdConfig.name] = flakeIdConfig;
        }
    }

}
