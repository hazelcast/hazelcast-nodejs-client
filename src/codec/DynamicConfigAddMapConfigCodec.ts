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

/* tslint:disable */
import * as Long from 'long';
import {Address} from '../Address';
import {AddressCodec} from'../builtin/AddressCodec';
import {MemberCodec} from '../builtin/MemberCodec';
import {Data} from '../serialization/Data';
import {SimpleEntryViewCodec} from '../builtin/SimpleEntryViewCodec';
import {DistributedObjectInfoCodec} from '../builtin/DistributedObjectInfoCodec';
import {DistributedObjectInfo} from '../builtin/DistributedObjectInfo';
import {Member} from '../core/Member';
import {UUID} from '../core/UUID';
import {FixedSizeTypes} from '../builtin/FixedSizeTypes'
import {BitsUtil} from '../BitsUtil'
import {ClientConnection} from '../invocation/ClientConnection'
import {ClientMessage, Frame} from '../ClientMessage'
import {Buffer} from 'safe-buffer'
import {ClientProtocolErrorCodes} from '../protocol/ClientProtocolErrorCodes'
import {CodecUtil} from '../builtin/CodecUtil'
import {DataCodec} from '../builtin/DataCodec'
import {ErrorCodec} from '../protocol/ErrorCodec'
import {ErrorsCodec} from '../protocol/ErrorsCodec'
import {ListIntegerCodec} from '../builtin/ListIntegerCodec'
import {ListUUIDCodec} from '../builtin/ListUUIDCodec'
import {ListLongCodec} from '../builtin/ListLongCodec'
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec'
import {LongArrayCodec} from '../builtin/LongArrayCodec'
import {MapCodec} from '../builtin/MapCodec'
import {MapIntegerLongCodec} from '../builtin/MapIntegerLongCodec'
import {MapIntegerUUIDCodec} from '../builtin/MapIntegerUUIDCodec'
import {MapStringLongCodec} from '../builtin/MapStringLongCodec'
import {MapUUIDLongCodec} from '../builtin/MapUUIDLongCodec'
import {StackTraceElementCodec} from '../protocol/StackTraceElementCodec'
import {StringCodec} from '../builtin/StringCodec'

    /* tslint:disabled:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
   export class RequestParameters {

        /**
         * TODO DOC
         */
        public name: string;

        /**
         * number of synchronous backups
         */
        public backupCount: number;

        /**
         * number of asynchronous backups
         */
        public asyncBackupCount: number;

        /**
         * maximum number of seconds for each entry to stay in the map.
         */
        public timeToLiveSeconds: number;

        /**
         * maximum number of seconds for each entry to stay idle in the map
         */
        public maxIdleSeconds: number;

        /**
         * eviction policy. Valid values: {@code NONE} (no eviction), {@code LRU}
         * (Least Recently Used), {@code LFU} (Least Frequently Used),
         * {@code RANDOM} (evict random entry).
         */
        public evictionPolicy: string;

        /**
         * {@code true} to enable reading local backup entries, {@code false} otherwise
         */
        public readBackupData: boolean;

        /**
         * control caching of de-serialized values. Valid values are {@code NEVER}
         * (Never cache de-serialized object), {@code INDEX_ONLY} (Cache values only
         * when they are inserted into an index) and {@code ALWAYS} (Always cache
         * de-serialized values
         */
        public cacheDeserializedValues: string;

        /**
         * class name of a class implementing
         * {@code com.hazelcast.map.merge.MapMergePolicy} to merge entries
         * while recovering from a split brain
         */
        public mergePolicy: string;

        /**
         * data type used to store entries. Valid values are {@code BINARY},
         * {@code OBJECT} and {@code NATIVE}.
         */
        public inMemoryFormat: string;

        /**
         * entry listener configurations
         */
        public listenerConfigs: Array<ListenerConfigHolder>;

        /**
         * partition lost listener configurations
         */
        public partitionLostListenerConfigs: Array<ListenerConfigHolder>;

        /**
         * {@code true} to enable gathering of statistics, otherwise {@code false}
         */
        public statisticsEnabled: boolean;

        /**
         * name of an existing configured quorum to be used to determine the minimum
         * number of members required in the cluster for the map to remain functional.
         * When {@code null}, quorum does not apply to this map's operations.
         */
        public quorumName: string;

        /**
         * custom {@code com.hazelcast.map.eviction.MapEvictionPolicy} implementation
         * or {@code null}
         */
        public mapEvictionPolicy: Data;

        /**
         * maximum size policy. Valid values are {@code PER_NODE},
         * {@code PER_PARTITION}, {@code USED_HEAP_PERCENTAGE}, {@code USED_HEAP_SIZE},
         * {@code FREE_HEAP_PERCENTAGE}, {@code FREE_HEAP_SIZE},
         * {@code USED_NATIVE_MEMORY_SIZE}, {@code USED_NATIVE_MEMORY_PERCENTAGE},
         * {@code FREE_NATIVE_MEMORY_SIZE}, {@code FREE_NATIVE_MEMORY_PERCENTAGE}.
         */
        public maxSizeConfigMaxSizePolicy: string;

        /**
         * maximum size of map
         */
        public maxSizeConfigSize: number;

        /**
         * configuration of backing map store or {@code null} for none
         */
        public mapStoreConfig: MapStoreConfigHolder;

        /**
         * configuration of near cache or {@code null} for none
         */
        public nearCacheConfig: NearCacheConfigHolder;

        /**
         * reference to an existing WAN replication configuration
         */
        public wanReplicationRef: WanReplicationRef;

        /**
         * map index configurations
         */
        public mapIndexConfigs: Array<MapIndexConfig>;

        /**
         * map attributes
         */
        public mapAttributeConfigs: Array<MapAttributeConfig>;

        /**
         * configurations for query caches on this map
         */
        public queryCacheConfigs: Array<QueryCacheConfigHolder>;

        /**
         * name of class implementing {@code com.hazelcast.core.PartitioningStrategy}
         * or {@code null}
         */
        public partitioningStrategyClassName: string;

        /**
         * a serialized instance of a partitioning strategy
         */
        public partitioningStrategyImplementation: Data;

        /**
         * hot restart configuration
         */
        public hotRestartConfig: HotRestartConfig;

        /**
         * Event Journal configuration
         */
        public eventJournalConfig: EventJournalConfig;

        /**
         * - merkle tree configuration
         */
        public merkleTreeConfig: MerkleTreeConfig;

        /**
         * TODO DOC
         */
        public mergeBatchSize: number;

        /**
         * metadata policy configuration for the supported data types. Valid values
         * are {@code CREATE_ON_UPDATE} and {@code OFF}
         */
        public metadataPolicy: number;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {
    };

/**
 * Adds a new map configuration to a running cluster.
 * If a map configuration with the given {@code name} already exists, then
 * the new configuration is ignored and the existing one is preserved.
 */
export class DynamicConfigAddMapConfigCodec {
    //hex: 0x1E0E00
    public static REQUEST_MESSAGE_TYPE = 1969664;
    //hex: 0x1E0E01
    public static RESPONSE_MESSAGE_TYPE = 1969665;
    private static REQUEST_BACKUP_COUNT_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET = DynamicConfigAddMapConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_TIME_TO_LIVE_SECONDS_FIELD_OFFSET = DynamicConfigAddMapConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_MAX_IDLE_SECONDS_FIELD_OFFSET = DynamicConfigAddMapConfigCodec.REQUEST_TIME_TO_LIVE_SECONDS_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_READ_BACKUP_DATA_FIELD_OFFSET = DynamicConfigAddMapConfigCodec.REQUEST_MAX_IDLE_SECONDS_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_STATISTICS_ENABLED_FIELD_OFFSET = DynamicConfigAddMapConfigCodec.REQUEST_READ_BACKUP_DATA_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_MAX_SIZE_CONFIG_SIZE_FIELD_OFFSET = DynamicConfigAddMapConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_MERGE_BATCH_SIZE_FIELD_OFFSET = DynamicConfigAddMapConfigCodec.REQUEST_MAX_SIZE_CONFIG_SIZE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_METADATA_POLICY_FIELD_OFFSET = DynamicConfigAddMapConfigCodec.REQUEST_MERGE_BATCH_SIZE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = DynamicConfigAddMapConfigCodec.REQUEST_METADATA_POLICY_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private DynamicConfigAddMapConfigCodec() {
    }


    static encodeRequest(name: string, backupCount: number, asyncBackupCount: number, timeToLiveSeconds: number, maxIdleSeconds: number, evictionPolicy: string, readBackupData: boolean, cacheDeserializedValues: string, mergePolicy: string, inMemoryFormat: string, listenerConfigs: Array<ListenerConfigHolder>, partitionLostListenerConfigs: Array<ListenerConfigHolder>, statisticsEnabled: boolean, quorumName: string, mapEvictionPolicy: Data, maxSizeConfigMaxSizePolicy: string, maxSizeConfigSize: number, mapStoreConfig: MapStoreConfigHolder, nearCacheConfig: NearCacheConfigHolder, wanReplicationRef: WanReplicationRef, mapIndexConfigs: Array<MapIndexConfig>, mapAttributeConfigs: Array<MapAttributeConfig>, queryCacheConfigs: Array<QueryCacheConfigHolder>, partitioningStrategyClassName: string, partitioningStrategyImplementation: Data, hotRestartConfig: HotRestartConfig, eventJournalConfig: EventJournalConfig, merkleTreeConfig: MerkleTreeConfig, mergeBatchSize: number, metadataPolicy: number) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("DynamicConfig.AddMapConfig");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(DynamicConfigAddMapConfigCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddMapConfigCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET, backupCount);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET, asyncBackupCount);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_TIME_TO_LIVE_SECONDS_FIELD_OFFSET, timeToLiveSeconds);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_MAX_IDLE_SECONDS_FIELD_OFFSET, maxIdleSeconds);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_READ_BACKUP_DATA_FIELD_OFFSET, readBackupData);
        FixedSizeTypes.encodeBoolean(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET, statisticsEnabled);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_MAX_SIZE_CONFIG_SIZE_FIELD_OFFSET, maxSizeConfigSize);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_MERGE_BATCH_SIZE_FIELD_OFFSET, mergeBatchSize);
        FixedSizeTypes.encodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_METADATA_POLICY_FIELD_OFFSET, metadataPolicy);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        StringCodec.encode(clientMessage, evictionPolicy);
        StringCodec.encode(clientMessage, cacheDeserializedValues);
        StringCodec.encode(clientMessage, mergePolicy);
        StringCodec.encode(clientMessage, inMemoryFormat);
        ListMultiFrameCodec.encodeNullable(clientMessage, listenerConfigs , ListenerConfigHolderCodec.encode);
        ListMultiFrameCodec.encodeNullable(clientMessage, partitionLostListenerConfigs , ListenerConfigHolderCodec.encode);
        CodecUtil.encodeNullable(clientMessage,  quorumName , StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  mapEvictionPolicy , DataCodec.encode );
        StringCodec.encode(clientMessage, maxSizeConfigMaxSizePolicy);
        CodecUtil.encodeNullable(clientMessage,  mapStoreConfig , MapStoreConfigHolderCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  nearCacheConfig , NearCacheConfigHolderCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  wanReplicationRef , WanReplicationRefCodec.encode );
        ListMultiFrameCodec.encodeNullable(clientMessage, mapIndexConfigs , MapIndexConfigCodec.encode);
        ListMultiFrameCodec.encodeNullable(clientMessage, mapAttributeConfigs , MapAttributeConfigCodec.encode);
        ListMultiFrameCodec.encodeNullable(clientMessage, queryCacheConfigs , QueryCacheConfigHolderCodec.encode);
        CodecUtil.encodeNullable(clientMessage,  partitioningStrategyClassName , StringCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  partitioningStrategyImplementation , DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  hotRestartConfig , HotRestartConfigCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  eventJournalConfig , EventJournalConfigCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  merkleTreeConfig , MerkleTreeConfigCodec.encode );
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.backupCount =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_BACKUP_COUNT_FIELD_OFFSET);
        request.asyncBackupCount =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_ASYNC_BACKUP_COUNT_FIELD_OFFSET);
        request.timeToLiveSeconds =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_TIME_TO_LIVE_SECONDS_FIELD_OFFSET);
        request.maxIdleSeconds =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_MAX_IDLE_SECONDS_FIELD_OFFSET);
        request.readBackupData =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_READ_BACKUP_DATA_FIELD_OFFSET);
        request.statisticsEnabled =  FixedSizeTypes.decodeBoolean(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_STATISTICS_ENABLED_FIELD_OFFSET);
        request.maxSizeConfigSize =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_MAX_SIZE_CONFIG_SIZE_FIELD_OFFSET);
        request.mergeBatchSize =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_MERGE_BATCH_SIZE_FIELD_OFFSET);
        request.metadataPolicy =  FixedSizeTypes.decodeInt(initialFrame.content, DynamicConfigAddMapConfigCodec.REQUEST_METADATA_POLICY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.evictionPolicy = StringCodec.decode(frame);
        request.cacheDeserializedValues = StringCodec.decode(frame);
        request.mergePolicy = StringCodec.decode(frame);
        request.inMemoryFormat = StringCodec.decode(frame);
        request.listenerConfigs = ListMultiFrameCodec.decodeNullable(frame, ListenerConfigHolderCodec.decode);
        request.partitionLostListenerConfigs = ListMultiFrameCodec.decodeNullable(frame, ListenerConfigHolderCodec.decode);
        request.quorumName = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.mapEvictionPolicy = CodecUtil.decodeNullable(frame, DataCodec.decode);
        request.maxSizeConfigMaxSizePolicy = StringCodec.decode(frame);
        request.mapStoreConfig = CodecUtil.decodeNullable(frame, MapStoreConfigHolderCodec.decode);
        request.nearCacheConfig = CodecUtil.decodeNullable(frame, NearCacheConfigHolderCodec.decode);
        request.wanReplicationRef = CodecUtil.decodeNullable(frame, WanReplicationRefCodec.decode);
        request.mapIndexConfigs = ListMultiFrameCodec.decodeNullable(frame, MapIndexConfigCodec.decode);
        request.mapAttributeConfigs = ListMultiFrameCodec.decodeNullable(frame, MapAttributeConfigCodec.decode);
        request.queryCacheConfigs = ListMultiFrameCodec.decodeNullable(frame, QueryCacheConfigHolderCodec.decode);
        request.partitioningStrategyClassName = CodecUtil.decodeNullable(frame, StringCodec.decode);
        request.partitioningStrategyImplementation = CodecUtil.decodeNullable(frame, DataCodec.decode);
        request.hotRestartConfig = CodecUtil.decodeNullable(frame, HotRestartConfigCodec.decode);
        request.eventJournalConfig = CodecUtil.decodeNullable(frame, EventJournalConfigCodec.decode);
        request.merkleTreeConfig = CodecUtil.decodeNullable(frame, MerkleTreeConfigCodec.decode);
        return request;
    }


     static encodeResponse() {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(DynamicConfigAddMapConfigCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, DynamicConfigAddMapConfigCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        //empty initial frame
        frame = frame.next;
        return response;
    }


static handle(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}