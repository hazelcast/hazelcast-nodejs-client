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
         * Name of the map
         */
        public name: string;

        /**
         * The slot number (or index) to start the iterator
         */
        public tableIndex: number;

        /**
         * The number of items to be batched
         */
        public batch: number;

        /**
         * projection to transform the entries with
         */
        public projection: Data;

        /**
         * predicate to filter the entries with
         */
        public predicate: Data;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * TODO DOC
         */
        public results : Array<Data>;

        /**
         * TODO DOC
         */
        public nextTableIndexToReadFrom : number;
    };

/**
 * Fetches the specified number of entries from the specified partition starting from specified table index
 * that match the predicate and applies the projection logic on them.
 */
export class MapFetchWithQueryCodec {
    //hex: 0x014600
    public static REQUEST_MESSAGE_TYPE = 83456;
    //hex: 0x014601
    public static RESPONSE_MESSAGE_TYPE = 83457;
    private static REQUEST_TABLE_INDEX_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_BATCH_FIELD_OFFSET = MapFetchWithQueryCodec.REQUEST_TABLE_INDEX_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = MapFetchWithQueryCodec.REQUEST_BATCH_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_NEXT_TABLE_INDEX_TO_READ_FROM_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = MapFetchWithQueryCodec.RESPONSE_NEXT_TABLE_INDEX_TO_READ_FROM_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;

    private MapFetchWithQueryCodec() {
    }


    static encodeRequest(name: string, tableIndex: number, batch: number, projection: Data, predicate: Data) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Map.FetchWithQuery");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(MapFetchWithQueryCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapFetchWithQueryCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, MapFetchWithQueryCodec.REQUEST_TABLE_INDEX_FIELD_OFFSET, tableIndex);
        FixedSizeTypes.encodeInt(initialFrame.content, MapFetchWithQueryCodec.REQUEST_BATCH_FIELD_OFFSET, batch);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, projection);
        DataCodec.encode(clientMessage, predicate);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.tableIndex =  FixedSizeTypes.decodeInt(initialFrame.content, MapFetchWithQueryCodec.REQUEST_TABLE_INDEX_FIELD_OFFSET);
        request.batch =  FixedSizeTypes.decodeInt(initialFrame.content, MapFetchWithQueryCodec.REQUEST_BATCH_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.projection = DataCodec.decode(frame);
        request.predicate = DataCodec.decode(frame);
        return request;
    }


     static encodeResponse(results: Array<Data> , nextTableIndexToReadFrom: number ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(MapFetchWithQueryCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapFetchWithQueryCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeInt(initialFrame.content, MapFetchWithQueryCodec.RESPONSE_NEXT_TABLE_INDEX_TO_READ_FROM_FIELD_OFFSET, nextTableIndexToReadFrom);
        ListMultiFrameCodec.encodeContainsNullable(clientMessage, results , DataCodec.encode);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.nextTableIndexToReadFrom =  FixedSizeTypes.decodeInt(initialFrame.content, MapFetchWithQueryCodec.RESPONSE_NEXT_TABLE_INDEX_TO_READ_FROM_FIELD_OFFSET);
        response.results = ListMultiFrameCodec.decodeContainsNullable(frame, DataCodec.decode);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}