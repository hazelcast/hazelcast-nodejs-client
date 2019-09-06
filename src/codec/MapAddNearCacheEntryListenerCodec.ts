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
     * name of map
     */
    public name: string;

    /**
     * flags of enabled listeners.
     */
    public listenerFlags: number;

    /**
     * if true fires events that originated from this node only, otherwise fires all events
     */
    public localOnly: boolean;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * A unique string which is used as a key to remove the listener.
     */
    public response: string;
}

/**
 * Adds an entry listener for this map. Listener will get notified for all map add/remove/update/evict events.
 */
/* tslint:disable:max-line-length no-bitwise */
export class MapAddNearCacheEntryListenerCodec {
    // hex: 0x011D00
    public static REQUEST_MESSAGE_TYPE = 72960;
    // hex: 0x011D01
    public static RESPONSE_MESSAGE_TYPE = 72961;
    private static REQUEST_LISTENER_FLAGS_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_LOCAL_ONLY_FIELD_OFFSET = MapAddNearCacheEntryListenerCodec.REQUEST_LISTENER_FLAGS_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = MapAddNearCacheEntryListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static EVENT_I_MAP_INVALIDATION_PARTITION_UUID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static EVENT_I_MAP_INVALIDATION_SEQUENCE_FIELD_OFFSET = MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_PARTITION_UUID_FIELD_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;
    private static EVENT_I_MAP_INVALIDATION_INITIAL_FRAME_SIZE = MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_SEQUENCE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    // hex: 0x011D02
    private static EVENT_I_MAP_INVALIDATION_MESSAGE_TYPE = 72962;
    private static EVENT_I_MAP_BATCH_INVALIDATION_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    // hex: 0x011D03
    private static EVENT_I_MAP_BATCH_INVALIDATION_MESSAGE_TYPE = 72963;

    static encodeRequest(name: string, listenerFlags: number, localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('Map.AddNearCacheEntryListener');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(MapAddNearCacheEntryListenerCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapAddNearCacheEntryListenerCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, MapAddNearCacheEntryListenerCodec.REQUEST_LISTENER_FLAGS_FIELD_OFFSET, listenerFlags);
        FixedSizeTypes.encodeBoolean(initialFrame.content, MapAddNearCacheEntryListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET, localOnly);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.listenerFlags =  FixedSizeTypes.decodeInt(initialFrame.content, MapAddNearCacheEntryListenerCodec.REQUEST_LISTENER_FLAGS_FIELD_OFFSET);
        request.localOnly =  FixedSizeTypes.decodeBoolean(initialFrame.content, MapAddNearCacheEntryListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: string ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(MapAddNearCacheEntryListenerCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapAddNearCacheEntryListenerCodec.RESPONSE_MESSAGE_TYPE);
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

     static encodeIMapInvalidationEvent( key: Data,  sourceUuid: string,  partitionUuid: UUID,  sequence: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_MESSAGE_TYPE);
        FixedSizeTypes.encodeUUID(initialFrame.content, MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_PARTITION_UUID_FIELD_OFFSET, partitionUuid);
        FixedSizeTypes.encodeLong(initialFrame.content, MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_SEQUENCE_FIELD_OFFSET, sequence);
        clientMessage.add(initialFrame);
        CodecUtil.encodeNullable(clientMessage,  key, DataCodec.encode );
        StringCodec.encode(clientMessage, sourceUuid);
        return clientMessage;
    }
     static encodeIMapBatchInvalidationEvent( keys: Array<Data>,  sourceUuids: Array<string>,  partitionUuids: Array<UUID>,  sequences: Array<Long>): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_BATCH_INVALIDATION_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_BATCH_INVALIDATION_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        ListMultiFrameCodec.encode(clientMessage, keys , DataCodec.encode);
        ListMultiFrameCodec.encode(clientMessage, sourceUuids , StringCodec.encode);
        ListUUIDCodec.encode(clientMessage, partitionUuids);
        ListLongCodec.encode(clientMessage, sequences);
        return clientMessage;
    }

    static handle(clientMessage: ClientMessage,  handleIMapInvalidation: any, handleIMapBatchInvalidation: any, toObjectFunction: (data: Data) => any = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_MESSAGE_TYPE) {
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        const partitionUuid: UUID  = FixedSizeTypes.decodeUUID(initialFrame.content, MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_PARTITION_UUID_FIELD_OFFSET);
        const sequence: Long  = FixedSizeTypes.decodeLong(initialFrame.content, MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_INVALIDATION_SEQUENCE_FIELD_OFFSET);
        const key: Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
        const sourceUuid: string = StringCodec.decode(frame);
        handleIMapInvalidation(key, sourceUuid, partitionUuid, sequence);
        return;
        }
        if (messageType === MapAddNearCacheEntryListenerCodec.EVENT_I_MAP_BATCH_INVALIDATION_MESSAGE_TYPE) {
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        const keys: Array<Data> = ListMultiFrameCodec.decode(frame, DataCodec.decode);
        const sourceUuids: string[] = ListMultiFrameCodec.decode(frame, StringCodec.decode);
        const partitionUuids: Array<UUID> = ListUUIDCodec.decode(frame);
        const sequences: Array<Long> = ListLongCodec.decode(frame);
        handleIMapBatchInvalidation(keys, sourceUuids, partitionUuids, sequences);
        return;
        }
    }
}
