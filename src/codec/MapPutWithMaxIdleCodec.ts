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
         * Name of the map.
         */
        public name: string;

        /**
         * Key for the map entry.
         */
        public key: Data;

        /**
         * Value for the map entry.
         */
        public value: Data;

        /**
         * The id of the user thread performing the operation. It is used to guarantee that only the lock holder thread (if a lock exists on the entry) can perform the requested operation.
         */
        public threadId: Long;

        /**
         * The duration in milliseconds after which this entry shall be deleted. O means infinite.
         */
        public ttl: Long;

        /**
         * The duration of maximum idle for this entry.
         * Milliseconds of idle, after which this entry shall be deleted. O means infinite.
         */
        public maxIdle: Long;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * old value of the entry
         */
        public response : Data;
    };

/**
 * Puts an entry into this map with a given ttl (time to live) value.Entry will expire and get evicted after the ttl
 * If ttl is 0, then the entry lives forever.This method returns a clone of the previous value, not the original
 * (identically equal) value previously put into the map.Time resolution for TTL is seconds. The given TTL value is
 * rounded to the next closest second value.
 */
export class MapPutWithMaxIdleCodec {
    //hex: 0x014A00
    public static REQUEST_MESSAGE_TYPE = 84480;
    //hex: 0x014A01
    public static RESPONSE_MESSAGE_TYPE = 84481;
    private static REQUEST_THREAD_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_TTL_FIELD_OFFSET = MapPutWithMaxIdleCodec.REQUEST_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_MAX_IDLE_FIELD_OFFSET = MapPutWithMaxIdleCodec.REQUEST_TTL_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = MapPutWithMaxIdleCodec.REQUEST_MAX_IDLE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    private MapPutWithMaxIdleCodec() {
    }


    static encodeRequest(name: string, key: Data, value: Data, threadId: Long, ttl: Long, maxIdle: Long) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Map.PutWithMaxIdle");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(MapPutWithMaxIdleCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapPutWithMaxIdleCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, MapPutWithMaxIdleCodec.REQUEST_THREAD_ID_FIELD_OFFSET, threadId);
        FixedSizeTypes.encodeLong(initialFrame.content, MapPutWithMaxIdleCodec.REQUEST_TTL_FIELD_OFFSET, ttl);
        FixedSizeTypes.encodeLong(initialFrame.content, MapPutWithMaxIdleCodec.REQUEST_MAX_IDLE_FIELD_OFFSET, maxIdle);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, key);
        DataCodec.encode(clientMessage, value);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, MapPutWithMaxIdleCodec.REQUEST_THREAD_ID_FIELD_OFFSET);
        request.ttl =  FixedSizeTypes.decodeLong(initialFrame.content, MapPutWithMaxIdleCodec.REQUEST_TTL_FIELD_OFFSET);
        request.maxIdle =  FixedSizeTypes.decodeLong(initialFrame.content, MapPutWithMaxIdleCodec.REQUEST_MAX_IDLE_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.key = DataCodec.decode(frame);
        request.value = DataCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: Data ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(MapPutWithMaxIdleCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapPutWithMaxIdleCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        CodecUtil.encodeNullable(clientMessage,  response , DataCodec.encode );
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        //empty initial frame
        frame = frame.next;
        response.response = CodecUtil.decodeNullable(frame, DataCodec.decode);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}