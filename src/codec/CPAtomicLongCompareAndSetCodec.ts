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
         * CP group id of this IAtomicLong instance.
         */
        public groupId: RaftGroupId;

        /**
         * Name of this IAtomicLong instance.
         */
        public name: string;

        /**
         * The expected value
         */
        public expected: Long;

        /**
         * The new value
         */
        public updated: Long;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * true if successful; or false if the actual value
         * was not equal to the expected value.
         */
        public response : boolean;
    };

/**
 * Atomically sets the value to the given updated value only if the current
 * value the expected value.
 */
export class CPAtomicLongCompareAndSetCodec {
    //hex: 0x230400
    public static REQUEST_MESSAGE_TYPE = 2294784;
    //hex: 0x230401
    public static RESPONSE_MESSAGE_TYPE = 2294785;
    private static REQUEST_EXPECTED_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_UPDATED_FIELD_OFFSET = CPAtomicLongCompareAndSetCodec.REQUEST_EXPECTED_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CPAtomicLongCompareAndSetCodec.REQUEST_UPDATED_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = CPAtomicLongCompareAndSetCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;

    private CPAtomicLongCompareAndSetCodec() {
    }


    static encodeRequest(groupId: RaftGroupId, name: string, expected: Long, updated: Long) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("CPAtomicLong.CompareAndSet");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(CPAtomicLongCompareAndSetCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPAtomicLongCompareAndSetCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, CPAtomicLongCompareAndSetCodec.REQUEST_EXPECTED_FIELD_OFFSET, expected);
        FixedSizeTypes.encodeLong(initialFrame.content, CPAtomicLongCompareAndSetCodec.REQUEST_UPDATED_FIELD_OFFSET, updated);
        clientMessage.add(initialFrame);
        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.expected =  FixedSizeTypes.decodeLong(initialFrame.content, CPAtomicLongCompareAndSetCodec.REQUEST_EXPECTED_FIELD_OFFSET);
        request.updated =  FixedSizeTypes.decodeLong(initialFrame.content, CPAtomicLongCompareAndSetCodec.REQUEST_UPDATED_FIELD_OFFSET);
        request.groupId = RaftGroupIdCodec.decode(frame);
        request.name = StringCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: boolean ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(CPAtomicLongCompareAndSetCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPAtomicLongCompareAndSetCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeBoolean(initialFrame.content, CPAtomicLongCompareAndSetCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.response =  FixedSizeTypes.decodeBoolean(initialFrame.content, CPAtomicLongCompareAndSetCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}