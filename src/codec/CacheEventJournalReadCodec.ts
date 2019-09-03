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
         * name of the cache
         */
        public name: string;

        /**
         * the startSequence of the first item to read
         */
        public startSequence: Long;

        /**
         * the minimum number of items to read.
         */
        public minSize: number;

        /**
         * the maximum number of items to read.
         */
        public maxSize: number;

        /**
         * the predicate to apply before processing events
         */
        public predicate: Data;

        /**
         * the projection to apply to journal events
         */
        public projection: Data;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * TODO DOC
         */
        public readCount : number;

        /**
         * TODO DOC
         */
        public items : Array<Data>;

        /**
         * TODO DOC
         */
        public itemSeqs : Array<Long>;

        /**
         * TODO DOC
         */
        public nextSeq : Long;
    };

/**
 * Reads from the cache event journal in batches. You may specify the start sequence,
 * the minimum required number of items in the response, the maximum number of items
 * in the response, a predicate that the events should pass and a projection to
 * apply to the events in the journal.
 * If the event journal currently contains less events than {@code minSize}, the
 * call will wait until it has sufficient items.
 * The predicate, filter and projection may be {@code null} in which case all elements are returned
 * and no projection is applied.
 */
export class CacheEventJournalReadCodec {
    //hex: 0x152200
    public static REQUEST_MESSAGE_TYPE = 1384960;
    //hex: 0x152201
    public static RESPONSE_MESSAGE_TYPE = 1384961;
    private static REQUEST_START_SEQUENCE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_MIN_SIZE_FIELD_OFFSET = CacheEventJournalReadCodec.REQUEST_START_SEQUENCE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_MAX_SIZE_FIELD_OFFSET = CacheEventJournalReadCodec.REQUEST_MIN_SIZE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CacheEventJournalReadCodec.REQUEST_MAX_SIZE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_READ_COUNT_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_NEXT_SEQ_FIELD_OFFSET = CacheEventJournalReadCodec.RESPONSE_READ_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = CacheEventJournalReadCodec.RESPONSE_NEXT_SEQ_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private CacheEventJournalReadCodec() {
    }


    static encodeRequest(name: string, startSequence: Long, minSize: number, maxSize: number, predicate: Data, projection: Data) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Cache.EventJournalRead");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(CacheEventJournalReadCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CacheEventJournalReadCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, CacheEventJournalReadCodec.REQUEST_START_SEQUENCE_FIELD_OFFSET, startSequence);
        FixedSizeTypes.encodeInt(initialFrame.content, CacheEventJournalReadCodec.REQUEST_MIN_SIZE_FIELD_OFFSET, minSize);
        FixedSizeTypes.encodeInt(initialFrame.content, CacheEventJournalReadCodec.REQUEST_MAX_SIZE_FIELD_OFFSET, maxSize);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage,  predicate , DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  projection , DataCodec.encode );
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.startSequence =  FixedSizeTypes.decodeLong(initialFrame.content, CacheEventJournalReadCodec.REQUEST_START_SEQUENCE_FIELD_OFFSET);
        request.minSize =  FixedSizeTypes.decodeInt(initialFrame.content, CacheEventJournalReadCodec.REQUEST_MIN_SIZE_FIELD_OFFSET);
        request.maxSize =  FixedSizeTypes.decodeInt(initialFrame.content, CacheEventJournalReadCodec.REQUEST_MAX_SIZE_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.predicate = CodecUtil.decodeNullable(frame, DataCodec.decode);
        request.projection = CodecUtil.decodeNullable(frame, DataCodec.decode);
        return request;
    }


     static encodeResponse(readCount: number , items: Array<Data> , itemSeqs: Array<Long> , nextSeq: Long ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(CacheEventJournalReadCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CacheEventJournalReadCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeInt(initialFrame.content, CacheEventJournalReadCodec.RESPONSE_READ_COUNT_FIELD_OFFSET, readCount);
        FixedSizeTypes.encodeLong(initialFrame.content, CacheEventJournalReadCodec.RESPONSE_NEXT_SEQ_FIELD_OFFSET, nextSeq);
        ListMultiFrameCodec.encode(clientMessage, items , DataCodec.encode);
        CodecUtil.encodeNullable(clientMessage,  itemSeqs , LongArrayCodec.encode );
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.readCount =  FixedSizeTypes.decodeInt(initialFrame.content, CacheEventJournalReadCodec.RESPONSE_READ_COUNT_FIELD_OFFSET);
        response.nextSeq =  FixedSizeTypes.decodeLong(initialFrame.content, CacheEventJournalReadCodec.RESPONSE_NEXT_SEQ_FIELD_OFFSET);
        response.items = ListMultiFrameCodec.decode(frame, DataCodec.decode);
        response.itemSeqs = CodecUtil.decodeNullable(frame, LongArrayCodec.decode);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}