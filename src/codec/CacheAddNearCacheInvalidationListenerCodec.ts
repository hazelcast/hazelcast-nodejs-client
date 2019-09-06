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
     * Name of the cache.
     */
    public name: string;

    /**
     * if true fires events that originated from this node only, otherwise fires all events
     */
    public localOnly: boolean;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * Registration id for the registered listener.
     */
    public response: string;
}

/**
 * Adds listener to cache. This listener will be used to listen near cache invalidation events.
 * Eventually consistent client near caches should use this method to add invalidation listeners
 * instead of {@link #addInvalidationListener(String, boolean)}
 */
/* tslint:disable:max-line-length no-bitwise */
export class CacheAddNearCacheInvalidationListenerCodec {
    // hex: 0x151E00
    public static REQUEST_MESSAGE_TYPE = 1383936;
    // hex: 0x151E01
    public static RESPONSE_MESSAGE_TYPE = 1383937;
    private static REQUEST_LOCAL_ONLY_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CacheAddNearCacheInvalidationListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static EVENT_CACHE_INVALIDATION_PARTITION_UUID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static EVENT_CACHE_INVALIDATION_SEQUENCE_FIELD_OFFSET = CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_PARTITION_UUID_FIELD_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;
    private static EVENT_CACHE_INVALIDATION_INITIAL_FRAME_SIZE = CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_SEQUENCE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    // hex: 0x151E02
    private static EVENT_CACHE_INVALIDATION_MESSAGE_TYPE = 1383938;
    private static EVENT_CACHE_BATCH_INVALIDATION_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    // hex: 0x151E03
    private static EVENT_CACHE_BATCH_INVALIDATION_MESSAGE_TYPE = 1383939;

    static encodeRequest(name: string, localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('Cache.AddNearCacheInvalidationListener');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CacheAddNearCacheInvalidationListenerCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CacheAddNearCacheInvalidationListenerCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, CacheAddNearCacheInvalidationListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET, localOnly);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.localOnly =  FixedSizeTypes.decodeBoolean(initialFrame.content, CacheAddNearCacheInvalidationListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: string ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CacheAddNearCacheInvalidationListenerCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CacheAddNearCacheInvalidationListenerCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response = StringCodec.decode(frame);
        return response;
    }

     static encodeCacheInvalidationEvent( name: string,  key: Data,  sourceUuid: string,  partitionUuid: UUID,  sequence: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_MESSAGE_TYPE);
        FixedSizeTypes.encodeUUID(initialFrame.content, CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_PARTITION_UUID_FIELD_OFFSET, partitionUuid);
        FixedSizeTypes.encodeLong(initialFrame.content, CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_SEQUENCE_FIELD_OFFSET, sequence);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage,  key, DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  sourceUuid, StringCodec.encode );
        return clientMessage;
    }
     static encodeCacheBatchInvalidationEvent( name: string,  keys: Array<Data>,  sourceUuids: Array<string>,  partitionUuids: Array<UUID>,  sequences: Array<Long>): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_BATCH_INVALIDATION_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_BATCH_INVALIDATION_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        ListMultiFrameCodec.encode(clientMessage, keys , DataCodec.encode);
        ListMultiFrameCodec.encodeNullable(clientMessage, sourceUuids , StringCodec.encode);
        ListUUIDCodec.encode(clientMessage, partitionUuids);
        ListLongCodec.encode(clientMessage, sequences);
        return clientMessage;
    }

    static handle(clientMessage: ClientMessage,  handleCacheInvalidation: any, handleCacheBatchInvalidation: any, toObjectFunction: (data: Data) => any = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_MESSAGE_TYPE) {
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        const partitionUuid: UUID  = FixedSizeTypes.decodeUUID(initialFrame.content, CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_PARTITION_UUID_FIELD_OFFSET);
        const sequence: Long  = FixedSizeTypes.decodeLong(initialFrame.content, CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_INVALIDATION_SEQUENCE_FIELD_OFFSET);
        const name: string = StringCodec.decode(frame);
        const key: Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
        const sourceUuid: string = CodecUtil.decodeNullable(frame, StringCodec.decode);
        handleCacheInvalidation(name, key, sourceUuid, partitionUuid, sequence);
        return;
        }
        if (messageType === CacheAddNearCacheInvalidationListenerCodec.EVENT_CACHE_BATCH_INVALIDATION_MESSAGE_TYPE) {
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        const name: string = StringCodec.decode(frame);
        const keys: Array<Data> = ListMultiFrameCodec.decode(frame, DataCodec.decode);
        const sourceUuids: string[] = ListMultiFrameCodec.decodeNullable(frame, StringCodec.decode);
        const partitionUuids: Array<UUID> = ListUUIDCodec.decode(frame);
        const sequences: Array<Long> = ListLongCodec.decode(frame);
        handleCacheBatchInvalidation(name, keys, sourceUuids, partitionUuids, sequences);
        return;
        }
    }
}
