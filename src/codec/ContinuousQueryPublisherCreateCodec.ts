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
     * Name of the map.
     */
    public mapName: string;

    /**
     * Name of query cache.
     */
    public cacheName: string;

    /**
     * The predicate to filter events which will be applied to the QueryCache.
     */
    public predicate: Data;

    /**
     * The size of batch. After reaching this minimum size, node immediately sends buffered events to QueryCache.
     */
    public batchSize: number;

    /**
     * Maximum number of events which can be stored in a buffer of partition.
     */
    public bufferSize: number;

    /**
     * The minimum number of delay seconds which an event waits in the buffer of node.
     */
    public delaySeconds: Long;

    /**
     * Flag to enable/disable initial population of the QueryCache.
     */
    public populate: boolean;

    /**
     * Flag to enable/disable coalescing. If true, then only the last updated value for a key is placed in the
     * batch, otherwise all changed values are included in the update.
     */
    public coalesce: boolean;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * Array of keys.
     */
    public response: Array<Data>;
}

/**
 * TODO DOC
 */
/* tslint:disable:max-line-length no-bitwise */
export class ContinuousQueryPublisherCreateCodec {
    // hex: 0x180200
    public static REQUEST_MESSAGE_TYPE = 1573376;
    // hex: 0x180201
    public static RESPONSE_MESSAGE_TYPE = 1573377;
    private static REQUEST_BATCH_SIZE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_BUFFER_SIZE_FIELD_OFFSET = ContinuousQueryPublisherCreateCodec.REQUEST_BATCH_SIZE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_DELAY_SECONDS_FIELD_OFFSET = ContinuousQueryPublisherCreateCodec.REQUEST_BUFFER_SIZE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_POPULATE_FIELD_OFFSET = ContinuousQueryPublisherCreateCodec.REQUEST_DELAY_SECONDS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_COALESCE_FIELD_OFFSET = ContinuousQueryPublisherCreateCodec.REQUEST_POPULATE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = ContinuousQueryPublisherCreateCodec.REQUEST_COALESCE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(mapName: string, cacheName: string, predicate: Data, batchSize: number, bufferSize: number, delaySeconds: Long, populate: boolean, coalesce: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('ContinuousQuery.PublisherCreate');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ContinuousQueryPublisherCreateCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ContinuousQueryPublisherCreateCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_BATCH_SIZE_FIELD_OFFSET, batchSize);
        FixedSizeTypes.encodeInt(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_BUFFER_SIZE_FIELD_OFFSET, bufferSize);
        FixedSizeTypes.encodeLong(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_DELAY_SECONDS_FIELD_OFFSET, delaySeconds);
        FixedSizeTypes.encodeBoolean(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_POPULATE_FIELD_OFFSET, populate);
        FixedSizeTypes.encodeBoolean(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_COALESCE_FIELD_OFFSET, coalesce);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, mapName);
        StringCodec.encode(clientMessage, cacheName);
        DataCodec.encode(clientMessage, predicate);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.batchSize =  FixedSizeTypes.decodeInt(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_BATCH_SIZE_FIELD_OFFSET);
        request.bufferSize =  FixedSizeTypes.decodeInt(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_BUFFER_SIZE_FIELD_OFFSET);
        request.delaySeconds =  FixedSizeTypes.decodeLong(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_DELAY_SECONDS_FIELD_OFFSET);
        request.populate =  FixedSizeTypes.decodeBoolean(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_POPULATE_FIELD_OFFSET);
        request.coalesce =  FixedSizeTypes.decodeBoolean(initialFrame.content, ContinuousQueryPublisherCreateCodec.REQUEST_COALESCE_FIELD_OFFSET);
        request.mapName = StringCodec.decode(frame);
        request.cacheName = StringCodec.decode(frame);
        request.predicate = DataCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: Array<Data> ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ContinuousQueryPublisherCreateCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ContinuousQueryPublisherCreateCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        ListMultiFrameCodec.encode(clientMessage, response , DataCodec.encode);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response = ListMultiFrameCodec.decode(frame, DataCodec.decode);
        return response;
    }
}
