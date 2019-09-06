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

import * as Long from 'long';
import {Address} from '../Address';
import {AddressCodec} from '../builtin/AddressCodec';
import {MemberCodec} from '../builtin/MemberCodec';
import {Data} from '../serialization/Data';
import {SimpleEntryViewCodec} from '../builtin/SimpleEntryViewCodec';
import {DistributedObjectInfoCodec} from '../builtin/DistributedObjectInfoCodec';
import {DistributedObjectInfo} from '../builtin/DistributedObjectInfo';
import {Member} from '../core/Member';
import {UUID} from '../core/UUID';
import {FixedSizeTypes} from '../builtin/FixedSizeTypes';
import {BitsUtil} from '../BitsUtil';
import {ClientConnection} from '../invocation/ClientConnection';
import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {ClientProtocolErrorCodes} from '../protocol/ClientProtocolErrorCodes';
import {CodecUtil} from '../builtin/CodecUtil';
import {DataCodec} from '../builtin/DataCodec';
import {ErrorCodec} from '../protocol/ErrorCodec';
import {ErrorsCodec} from '../protocol/ErrorsCodec';
import {ListIntegerCodec} from '../builtin/ListIntegerCodec';
import {ListUUIDCodec} from '../builtin/ListUUIDCodec';
import {ListLongCodec} from '../builtin/ListLongCodec';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {LongArrayCodec} from '../builtin/LongArrayCodec';
import {MapCodec} from '../builtin/MapCodec';
import {MapIntegerLongCodec} from '../builtin/MapIntegerLongCodec';
import {MapIntegerUUIDCodec} from '../builtin/MapIntegerUUIDCodec';
import {MapStringLongCodec} from '../builtin/MapStringLongCodec';
import {MapUUIDLongCodec} from '../builtin/MapUUIDLongCodec';
import {StackTraceElementCodec} from '../protocol/StackTraceElementCodec';
import {StringCodec} from '../builtin/StringCodec';

/* tslint:disabled:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class RequestParameters {

    /**
     * cache name
     */
    public name: string;

    /**
     * class name of key type
     */
    public keyType: string;

    /**
     * class name of value type
     */
    public valueType: string;

    /**
     * {@code true} to enable gathering of statistics, otherwise {@code false}
     */
    public statisticsEnabled: boolean;

    /**
     * {@code true} to enable management interface on this cache or {@code false}
     */
    public managementEnabled: boolean;

    /**
     * {@code true} to enable read through from a {@code CacheLoader}
     */
    public readThrough: boolean;

    /**
     * {@code true} to enable write through to a {@code CacheWriter}
     */
    public writeThrough: boolean;

    /**
     * name of cache loader factory class, if one is configured
     */
    public cacheLoaderFactory: string;

    /**
     * name of cache writer factory class, if one is configured
     */
    public cacheWriterFactory: string;

    /**
     * Factory                    name of cache loader factory class, if one is configured
     */
    public cacheLoader: string;

    /**
     * Factory                    name of cache writer factory class, if one is configured
     */
    public cacheWriter: string;

    /**
     * number of synchronous backups
     */
    public backupCount: number;

    /**
     * number of asynchronous backups
     */
    public asyncBackupCount: number;

    /**
     * data type used to store entries. Valid values are {@code BINARY},
     * {@code OBJECT} and {@code NATIVE}.
     */
    public inMemoryFormat: string;

    /**
     * name of an existing configured split brain protection to be used to determine the minimum
     * number of members required in the cluster for the cache to remain functional.
     * When {@code null}, split brain protection does not apply to this cache's operations.
     */
    public splitBrainProtectionName: string;

    /**
     * name of a class implementing {@link com.hazelcast.cache.CacheMergePolicy}
     * that handles merging of values for this cache while recovering from
     * network partitioning
     */
    public mergePolicy: string;

    /**
     * when {@code true} disables invalidation events for per entry but
     * full-flush invalidation events are still enabled.
     */
    public disablePerEntryInvalidationEvents: boolean;

    /**
     * partition lost listener configurations
     */
    public partitionLostListenerConfigs: Array<ListenerConfigHolder>;

    /**
     * expiry policy factory class name. When configuring an expiry policy,
     * either this or {@ode timedExpiryPolicyFactoryConfig} should be configured.
     */
    public expiryPolicyFactoryClassName: string;

    /**
     * expiry policy factory with duration configuration
     */
    public timedExpiryPolicyFactoryConfig: TimedExpiryPolicyFactoryConfig;

    /**
     * cache entry listeners configuration
     */
    public cacheEntryListeners: Array<CacheSimpleEntryListenerConfig>;

    /**
     * cache eviction configuration
     */
    public evictionConfig: EvictionConfigHolder;

    /**
     * reference to an existing WAN replication configuration
     */
    public wanReplicationRef: WanReplicationRef;

    /**
     * Event Journal configuration
     */
    public eventJournalConfig: EventJournalConfig;

    /**
     * hot restart configuration
     */
    public hotRestartConfig: HotRestartConfig;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {
}

/**
 * Adds a new cache configuration to a running cluster.
 * If a cache configuration with the given {@code name} already exists, then
 * the new configuration is ignored and the existing one is preserved.
 */
/* tslint:disable:max-line-length no-bitwise */
export class DynamicConfigAddCacheConfigCodec {
    // hex: 0x1E1000
    public static REQUEST_MESSAGE_TYPE = 1970176;
    // hex: 0x1E1001
    public static RESPONSE_MESSAGE_TYPE = 1970177;
    private static REQUEST_STATISTICS_ENABLED_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_MANAGEMENT_ENABLED_FIELD_OFFSET = DynamicConfigAddCacheConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_READ_THROUGH_FIELD_OFFSET = DynamicConfigAddCacheConfigCodec.REQUEST_MANAGEMENT_ENABLED_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_WRITE_THROUGH_FIELD_OFFSET = DynamicConfigAddCacheConfigCodec.REQUEST_READ_THROUGH_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_BACKUP_COUNT_FIELD_OFFSET = DynamicConfigAddCacheConfigCodec.REQUEST_WRITE_THROUGH_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET = DynamicConfigAddCacheConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_DISABLE_PER_ENTRY_INVALIDATION_EVENTS_FIELD_OFFSET = DynamicConfigAddCacheConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = DynamicConfigAddCacheConfigCodec.REQUEST_DISABLE_PER_ENTRY_INVALIDATION_EVENTS_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(name: string, keyType: string, valueType: string, statisticsEnabled: boolean, managementEnabled: boolean, readThrough: boolean, writeThrough: boolean, cacheLoaderFactory: string, cacheWriterFactory: string, cacheLoader: string, cacheWriter: string, backupCount: number, asyncBackupCount: number, inMemoryFormat: string, splitBrainProtectionName: string, mergePolicy: string, disablePerEntryInvalidationEvents: boolean, partitionLostListenerConfigs: Array<ListenerConfigHolder>, expiryPolicyFactoryClassName: string, timedExpiryPolicyFactoryConfig: TimedExpiryPolicyFactoryConfig, cacheEntryListeners: Array<CacheSimpleEntryListenerConfig>, evictionConfig: EvictionConfigHolder, wanReplicationRef: WanReplicationRef, eventJournalConfig: EventJournalConfig, hotRestartConfig: HotRestartConfig): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('DynamicConfig.AddCacheConfig');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddCacheConfigCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddCacheConfigCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET, statisticsEnabled);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_MANAGEMENT_ENABLED_FIELD_OFFSET, managementEnabled);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_READ_THROUGH_FIELD_OFFSET, readThrough);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_WRITE_THROUGH_FIELD_OFFSET, writeThrough);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET, backupCount);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET, asyncBackupCount);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_DISABLE_PER_ENTRY_INVALIDATION_EVENTS_FIELD_OFFSET, disablePerEntryInvalidationEvents);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage,  keyType, StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  valueType, StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  cacheLoaderFactory, StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  cacheWriterFactory, StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  cacheLoader, StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  cacheWriter, StringCodec.encode );
        StringCodec.encode(clientMessage, inMemoryFormat);
        CodecUtil.encodeNullable(clientMessage,  splitBrainProtectionName, StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  mergePolicy, StringCodec.encode );
        ListMultiFrameCodec.encodeNullable(clientMessage, partitionLostListenerConfigs , ListenerConfigHolderCodec.encode);
        CodecUtil.encodeNullable(clientMessage,  expiryPolicyFactoryClassName, StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  timedExpiryPolicyFactoryConfig, TimedExpiryPolicyFactoryConfigCodec.encode );
        ListMultiFrameCodec.encodeNullable(clientMessage, cacheEntryListeners , CacheSimpleEntryListenerConfigCodec.encode);
        CodecUtil.encodeNullable(clientMessage,  evictionConfig, EvictionConfigHolderCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  wanReplicationRef, WanReplicationRefCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  eventJournalConfig, EventJournalConfigCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  hotRestartConfig, HotRestartConfigCodec.encode );
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.statisticsEnabled =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET);
        request.managementEnabled =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_MANAGEMENT_ENABLED_FIELD_OFFSET);
        request.readThrough =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_READ_THROUGH_FIELD_OFFSET);
        request.writeThrough =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_WRITE_THROUGH_FIELD_OFFSET);
        request.backupCount =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET);
        request.asyncBackupCount =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET);
        request.disablePerEntryInvalidationEvents =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddCacheConfigCodec.REQUEST_DISABLE_PER_ENTRY_INVALIDATION_EVENTS_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.keyType = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.valueType = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.cacheLoaderFactory = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.cacheWriterFactory = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.cacheLoader = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.cacheWriter = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.inMemoryFormat = StringCodec.decode(frame);
        request.splitBrainProtectionName = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.mergePolicy = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.partitionLostListenerConfigs = ListMultiFrameCodec.decodeNullable(frame, ListenerConfigHolderCodec.decode);
        request.expiryPolicyFactoryClassName = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.timedExpiryPolicyFactoryConfig = CodecUtil.decodeNullable(frame, TimedExpiryPolicyFactoryConfigCodec.decode);
        request.cacheEntryListeners = ListMultiFrameCodec.decodeNullable(frame, CacheSimpleEntryListenerConfigCodec.decode);
        request.evictionConfig = CodecUtil.decodeNullable(frame, EvictionConfigHolderCodec.decode);
        request.wanReplicationRef = CodecUtil.decodeNullable(frame, WanReplicationRefCodec.decode);
        request.eventJournalConfig = CodecUtil.decodeNullable(frame, EventJournalConfigCodec.decode);
        request.hotRestartConfig = CodecUtil.decodeNullable(frame, HotRestartConfigCodec.decode);
        return request;
    }

     static encodeResponse(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddCacheConfigCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddCacheConfigCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        return response;
    }
}
