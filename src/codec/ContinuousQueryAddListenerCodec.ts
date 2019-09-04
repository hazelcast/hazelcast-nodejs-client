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
         * Name of the MapListener which will be used to listen this QueryCache
         */
        public listenerName: string;

        /**
         * if true fires events that originated from this node only, otherwise fires all events
         */
        public localOnly: boolean;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * Registration id for the listener.
         */
        public response : string;
    };

/**
 * TODO DOC
 */
export class ContinuousQueryAddListenerCodec {
    //hex: 0x180400
    public static REQUEST_MESSAGE_TYPE = 1573888;
    //hex: 0x180401
    public static RESPONSE_MESSAGE_TYPE = 1573889;
    private static REQUEST_LOCAL_ONLY_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = ContinuousQueryAddListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    static EVENT_QUERY_CACHE_SINGLE_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    //hex: 0x180402
    static EVENT_QUERY_CACHE_SINGLE_MESSAGE_TYPE = 1573890;
    static EVENT_QUERY_CACHE_BATCH_PARTITION_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    static EVENT_QUERY_CACHE_BATCH_INITIAL_FRAME_SIZE = ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_BATCH_PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    //hex: 0x180403
    static EVENT_QUERY_CACHE_BATCH_MESSAGE_TYPE = 1573891;

    private ContinuousQueryAddListenerCodec() {
    }


    static encodeRequest(listenerName: string, localOnly: boolean) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("ContinuousQuery.AddListener");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(ContinuousQueryAddListenerCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ContinuousQueryAddListenerCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, ContinuousQueryAddListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET, localOnly);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, listenerName);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.localOnly =  FixedSizeTypes.decodeBoolean(initialFrame.content, ContinuousQueryAddListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET);
        request.listenerName = StringCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: string ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ContinuousQueryAddListenerCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ContinuousQueryAddListenerCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        //empty initial frame
        frame = frame.next;
        response.response = StringCodec.decode(frame);
        return response;
    }

     static encodeQueryCacheSingleEvent( data : QueryCacheEventData) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_SINGLE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_SINGLE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        QueryCacheEventDataCodec.encode(clientMessage, data);
        return clientMessage;
    }
     static encodeQueryCacheBatchEvent( events : Array<QueryCacheEventData>,  source : string,  partitionId : number) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_BATCH_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_BATCH_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_BATCH_PARTITION_ID_FIELD_OFFSET, partitionId);
        clientMessage.add(initialFrame);
        ListMultiFrameCodec.encode(clientMessage, events , QueryCacheEventDataCodec.encode);
        StringCodec.encode(clientMessage, source);
        return clientMessage;
    }

static handle(clientMessage : ClientMessage,  handleQueryCacheSingle: any, handleQueryCacheBatch: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
            if (messageType == ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_SINGLE_MESSAGE_TYPE) {
                frame = frame.next;
                var data : QueryCacheEventData = QueryCacheEventDataCodec.decode(frame);
                handleQueryCacheSingle(data);
                return;
            }
            if (messageType == ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_BATCH_MESSAGE_TYPE) {
                var initialFrame : Frame = frame.next;
                var partitionId : number  = FixedSizeTypes.decodeInt(initialFrame.content, ContinuousQueryAddListenerCodec.EVENT_QUERY_CACHE_BATCH_PARTITION_ID_FIELD_OFFSET);
                var events : Array<QueryCacheEventData> = ListMultiFrameCodec.decode(frame, QueryCacheEventDataCodec.decode);
                var source : string = StringCodec.decode(frame);
                handleQueryCacheBatch(events, source, partitionId);
                return;
            }
        }
}