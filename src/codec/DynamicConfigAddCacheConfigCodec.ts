/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {UUIDCodec} from './UUIDCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {DynamicConfigMessageType} from './DynamicConfigMessageType';

var REQUEST_TYPE = DynamicConfigMessageType.DYNAMICCONFIG_ADDCACHECONFIG;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class DynamicConfigAddCacheConfigCodec {


    static calculateSize(name: string, keyType: string, valueType: string, statisticsEnabled: boolean, managementEnabled: boolean, readThrough: boolean, writeThrough: boolean, cacheLoaderFactory: string, cacheWriterFactory: string, cacheLoader: string, cacheWriter: string, backupCount: number, asyncBackupCount: number, inMemoryFormat: string, quorumName: string, mergePolicy: string, disablePerEntryInvalidationEvents: boolean, partitionLostListenerConfigs: any, expiryPolicyFactoryClassName: string, timedExpiryPolicyFactoryConfig: any, cacheEntryListeners: any, evictionConfig: any, wanReplicationRef: any, hotRestartConfig: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (keyType !== null) {
            dataSize += BitsUtil.calculateSizeString(keyType);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (valueType !== null) {
            dataSize += BitsUtil.calculateSizeString(valueType);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (cacheLoaderFactory !== null) {
            dataSize += BitsUtil.calculateSizeString(cacheLoaderFactory);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (cacheWriterFactory !== null) {
            dataSize += BitsUtil.calculateSizeString(cacheWriterFactory);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (cacheLoader !== null) {
            dataSize += BitsUtil.calculateSizeString(cacheLoader);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (cacheWriter !== null) {
            dataSize += BitsUtil.calculateSizeString(cacheWriter);
        }
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeString(inMemoryFormat);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (quorumName !== null) {
            dataSize += BitsUtil.calculateSizeString(quorumName);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (mergePolicy !== null) {
            dataSize += BitsUtil.calculateSizeString(mergePolicy);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (partitionLostListenerConfigs !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            partitionLostListenerConfigs.forEach((partitionLostListenerConfigsItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.listenerconfigholder(partitionLostListenerConfigsItem);
            });
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (expiryPolicyFactoryClassName !== null) {
            dataSize += BitsUtil.calculateSizeString(expiryPolicyFactoryClassName);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (timedExpiryPolicyFactoryConfig !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.config.cachesimpleconfig.expirypolicyfactoryconfig.timedexpirypolicyfactoryconfig(timedExpiryPolicyFactoryConfig);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (cacheEntryListeners !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            cacheEntryListeners.forEach((cacheEntryListenersItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.config.cachesimpleentrylistenerconfig(cacheEntryListenersItem);
            });
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (evictionConfig !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.evictionconfigholder(evictionConfig);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (wanReplicationRef !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.config.wanreplicationref(wanReplicationRef);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (hotRestartConfig !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.config.hotrestartconfig(hotRestartConfig);
        }
        return dataSize;
    }

    static encodeRequest(name: string, keyType: string, valueType: string, statisticsEnabled: boolean, managementEnabled: boolean, readThrough: boolean, writeThrough: boolean, cacheLoaderFactory: string, cacheWriterFactory: string, cacheLoader: string, cacheWriter: string, backupCount: number, asyncBackupCount: number, inMemoryFormat: string, quorumName: string, mergePolicy: string, disablePerEntryInvalidationEvents: boolean, partitionLostListenerConfigs: any, expiryPolicyFactoryClassName: string, timedExpiryPolicyFactoryConfig: any, cacheEntryListeners: any, evictionConfig: any, wanReplicationRef: any, hotRestartConfig: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, keyType, valueType, statisticsEnabled, managementEnabled, readThrough, writeThrough, cacheLoaderFactory, cacheWriterFactory, cacheLoader, cacheWriter, backupCount, asyncBackupCount, inMemoryFormat, quorumName, mergePolicy, disablePerEntryInvalidationEvents, partitionLostListenerConfigs, expiryPolicyFactoryClassName, timedExpiryPolicyFactoryConfig, cacheEntryListeners, evictionConfig, wanReplicationRef, hotRestartConfig));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendBoolean(keyType === null);
        if (keyType !== null) {
            clientMessage.appendString(keyType);
        }
        clientMessage.appendBoolean(valueType === null);
        if (valueType !== null) {
            clientMessage.appendString(valueType);
        }
        clientMessage.appendBoolean(statisticsEnabled);
        clientMessage.appendBoolean(managementEnabled);
        clientMessage.appendBoolean(readThrough);
        clientMessage.appendBoolean(writeThrough);
        clientMessage.appendBoolean(cacheLoaderFactory === null);
        if (cacheLoaderFactory !== null) {
            clientMessage.appendString(cacheLoaderFactory);
        }
        clientMessage.appendBoolean(cacheWriterFactory === null);
        if (cacheWriterFactory !== null) {
            clientMessage.appendString(cacheWriterFactory);
        }
        clientMessage.appendBoolean(cacheLoader === null);
        if (cacheLoader !== null) {
            clientMessage.appendString(cacheLoader);
        }
        clientMessage.appendBoolean(cacheWriter === null);
        if (cacheWriter !== null) {
            clientMessage.appendString(cacheWriter);
        }
        clientMessage.appendInt32(backupCount);
        clientMessage.appendInt32(asyncBackupCount);
        clientMessage.appendString(inMemoryFormat);
        clientMessage.appendBoolean(quorumName === null);
        if (quorumName !== null) {
            clientMessage.appendString(quorumName);
        }
        clientMessage.appendBoolean(mergePolicy === null);
        if (mergePolicy !== null) {
            clientMessage.appendString(mergePolicy);
        }
        clientMessage.appendBoolean(disablePerEntryInvalidationEvents);
        clientMessage.appendBoolean(partitionLostListenerConfigs === null);
        if (partitionLostListenerConfigs !== null) {
            clientMessage.appendInt32(partitionLostListenerConfigs.length);

            partitionLostListenerConfigs.forEach((partitionLostListenerConfigsItem: any) => {
                ListenerConfigCodec.encode(clientMessage, partitionLostListenerConfigsItem);
            });

        }
        clientMessage.appendBoolean(expiryPolicyFactoryClassName === null);
        if (expiryPolicyFactoryClassName !== null) {
            clientMessage.appendString(expiryPolicyFactoryClassName);
        }
        clientMessage.appendBoolean(timedExpiryPolicyFactoryConfig === null);
        if (timedExpiryPolicyFactoryConfig !== null) {
            TimedExpiryPolicyFactoryConfigCodec.encode(clientMessage, timedExpiryPolicyFactoryConfig);
        }
        clientMessage.appendBoolean(cacheEntryListeners === null);
        if (cacheEntryListeners !== null) {
            clientMessage.appendInt32(cacheEntryListeners.length);

            cacheEntryListeners.forEach((cacheEntryListenersItem: any) => {
                CacheSimpleEntryListenerConfigCodec.encode(clientMessage, cacheEntryListenersItem);
            });

        }
        clientMessage.appendBoolean(evictionConfig === null);
        if (evictionConfig !== null) {
            EvictionConfigCodec.encode(clientMessage, evictionConfig);
        }
        clientMessage.appendBoolean(wanReplicationRef === null);
        if (wanReplicationRef !== null) {
            WanReplicationRefCodec.encode(clientMessage, wanReplicationRef);
        }
        clientMessage.appendBoolean(hotRestartConfig === null);
        if (hotRestartConfig !== null) {
            HotRestartConfigCodec.encode(clientMessage, hotRestartConfig);
        }
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
