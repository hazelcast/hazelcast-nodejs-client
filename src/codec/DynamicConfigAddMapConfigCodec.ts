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

var REQUEST_TYPE = DynamicConfigMessageType.DYNAMICCONFIG_ADDMAPCONFIG;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class DynamicConfigAddMapConfigCodec {


    static calculateSize(name: string, backupCount: number, asyncBackupCount: number, timeToLiveSeconds: number, maxIdleSeconds: number, evictionPolicy: string, readBackupData: boolean, cacheDeserializedValues: string, mergePolicy: string, inMemoryFormat: string, listenerConfigs: any, partitionLostListenerConfigs: any, statisticsEnabled: boolean, quorumName: string, mapEvictionPolicy: Data, maxSizeConfigMaxSizePolicy: string, maxSizeConfigSize: number, mapStoreConfig: any, nearCacheConfig: any, wanReplicationRef: any, mapIndexConfigs: any, mapAttributeConfigs: any, queryCacheConfigs: any, partitioningStrategyClassName: string, partitioningStrategyImplementation: Data, hotRestartConfig: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeString(evictionPolicy);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeString(cacheDeserializedValues);
        dataSize += BitsUtil.calculateSizeString(mergePolicy);
        dataSize += BitsUtil.calculateSizeString(inMemoryFormat);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (listenerConfigs !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            listenerConfigs.forEach((listenerConfigsItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.listenerconfigholder(listenerConfigsItem);
            });
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (partitionLostListenerConfigs !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            partitionLostListenerConfigs.forEach((partitionLostListenerConfigsItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.listenerconfigholder(partitionLostListenerConfigsItem);
            });
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (quorumName !== null) {
            dataSize += BitsUtil.calculateSizeString(quorumName);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (mapEvictionPolicy !== null) {
            dataSize += BitsUtil.calculateSizeData(mapEvictionPolicy);
        }
        dataSize += BitsUtil.calculateSizeString(maxSizeConfigMaxSizePolicy);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (mapStoreConfig !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.mapstoreconfigholder(mapStoreConfig);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (nearCacheConfig !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.nearcacheconfigholder(nearCacheConfig);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (wanReplicationRef !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.config.wanreplicationref(wanReplicationRef);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (mapIndexConfigs !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            mapIndexConfigs.forEach((mapIndexConfigsItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.config.mapindexconfig(mapIndexConfigsItem);
            });
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (mapAttributeConfigs !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            mapAttributeConfigs.forEach((mapAttributeConfigsItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.config.mapattributeconfig(mapAttributeConfigsItem);
            });
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (queryCacheConfigs !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            queryCacheConfigs.forEach((queryCacheConfigsItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.querycacheconfigholder(queryCacheConfigsItem);
            });
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (partitioningStrategyClassName !== null) {
            dataSize += BitsUtil.calculateSizeString(partitioningStrategyClassName);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (partitioningStrategyImplementation !== null) {
            dataSize += BitsUtil.calculateSizeData(partitioningStrategyImplementation);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (hotRestartConfig !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.config.hotrestartconfig(hotRestartConfig);
        }
        return dataSize;
    }

    static encodeRequest(name: string, backupCount: number, asyncBackupCount: number, timeToLiveSeconds: number, maxIdleSeconds: number, evictionPolicy: string, readBackupData: boolean, cacheDeserializedValues: string, mergePolicy: string, inMemoryFormat: string, listenerConfigs: any, partitionLostListenerConfigs: any, statisticsEnabled: boolean, quorumName: string, mapEvictionPolicy: Data, maxSizeConfigMaxSizePolicy: string, maxSizeConfigSize: number, mapStoreConfig: any, nearCacheConfig: any, wanReplicationRef: any, mapIndexConfigs: any, mapAttributeConfigs: any, queryCacheConfigs: any, partitioningStrategyClassName: string, partitioningStrategyImplementation: Data, hotRestartConfig: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, backupCount, asyncBackupCount, timeToLiveSeconds, maxIdleSeconds, evictionPolicy, readBackupData, cacheDeserializedValues, mergePolicy, inMemoryFormat, listenerConfigs, partitionLostListenerConfigs, statisticsEnabled, quorumName, mapEvictionPolicy, maxSizeConfigMaxSizePolicy, maxSizeConfigSize, mapStoreConfig, nearCacheConfig, wanReplicationRef, mapIndexConfigs, mapAttributeConfigs, queryCacheConfigs, partitioningStrategyClassName, partitioningStrategyImplementation, hotRestartConfig));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(backupCount);
        clientMessage.appendInt32(asyncBackupCount);
        clientMessage.appendInt32(timeToLiveSeconds);
        clientMessage.appendInt32(maxIdleSeconds);
        clientMessage.appendString(evictionPolicy);
        clientMessage.appendBoolean(readBackupData);
        clientMessage.appendString(cacheDeserializedValues);
        clientMessage.appendString(mergePolicy);
        clientMessage.appendString(inMemoryFormat);
        clientMessage.appendBoolean(listenerConfigs === null);
        if (listenerConfigs !== null) {
            clientMessage.appendInt32(listenerConfigs.length);

            listenerConfigs.forEach((listenerConfigsItem: any) => {
                ListenerConfigCodec.encode(clientMessage, listenerConfigsItem);
            });

        }
        clientMessage.appendBoolean(partitionLostListenerConfigs === null);
        if (partitionLostListenerConfigs !== null) {
            clientMessage.appendInt32(partitionLostListenerConfigs.length);

            partitionLostListenerConfigs.forEach((partitionLostListenerConfigsItem: any) => {
                ListenerConfigCodec.encode(clientMessage, partitionLostListenerConfigsItem);
            });

        }
        clientMessage.appendBoolean(statisticsEnabled);
        clientMessage.appendBoolean(quorumName === null);
        if (quorumName !== null) {
            clientMessage.appendString(quorumName);
        }
        clientMessage.appendBoolean(mapEvictionPolicy === null);
        if (mapEvictionPolicy !== null) {
            clientMessage.appendData(mapEvictionPolicy);
        }
        clientMessage.appendString(maxSizeConfigMaxSizePolicy);
        clientMessage.appendInt32(maxSizeConfigSize);
        clientMessage.appendBoolean(mapStoreConfig === null);
        if (mapStoreConfig !== null) {
            MapStoreConfigCodec.encode(clientMessage, mapStoreConfig);
        }
        clientMessage.appendBoolean(nearCacheConfig === null);
        if (nearCacheConfig !== null) {
            NearCacheConfigCodec.encode(clientMessage, nearCacheConfig);
        }
        clientMessage.appendBoolean(wanReplicationRef === null);
        if (wanReplicationRef !== null) {
            WanReplicationRefCodec.encode(clientMessage, wanReplicationRef);
        }
        clientMessage.appendBoolean(mapIndexConfigs === null);
        if (mapIndexConfigs !== null) {
            clientMessage.appendInt32(mapIndexConfigs.length);

            mapIndexConfigs.forEach((mapIndexConfigsItem: any) => {
                MapIndexConfigCodec.encode(clientMessage, mapIndexConfigsItem);
            });

        }
        clientMessage.appendBoolean(mapAttributeConfigs === null);
        if (mapAttributeConfigs !== null) {
            clientMessage.appendInt32(mapAttributeConfigs.length);

            mapAttributeConfigs.forEach((mapAttributeConfigsItem: any) => {
                MapAttributeConfigCodec.encode(clientMessage, mapAttributeConfigsItem);
            });

        }
        clientMessage.appendBoolean(queryCacheConfigs === null);
        if (queryCacheConfigs !== null) {
            clientMessage.appendInt32(queryCacheConfigs.length);

            queryCacheConfigs.forEach((queryCacheConfigsItem: any) => {
                QueryCacheConfigCodec.encode(clientMessage, queryCacheConfigsItem);
            });

        }
        clientMessage.appendBoolean(partitioningStrategyClassName === null);
        if (partitioningStrategyClassName !== null) {
            clientMessage.appendString(partitioningStrategyClassName);
        }
        clientMessage.appendBoolean(partitioningStrategyImplementation === null);
        if (partitioningStrategyImplementation !== null) {
            clientMessage.appendData(partitioningStrategyImplementation);
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
