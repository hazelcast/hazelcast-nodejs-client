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
         * CP group id of this IAtomicReference instance.
         */
        public groupId: RaftGroupId;

        /**
         * Name of this IAtomicReference instance.
         */
        public name: string;

        /**
         * The expected value
         */
        public oldValue: Data;

        /**
         * The new value
         */
        public newValue: Data;
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
 * Alters the currently stored value by applying a function on it.
 */
export class CPAtomicRefCompareAndSetCodec {
    //hex: 0x240200
    public static REQUEST_MESSAGE_TYPE = 2359808;
    //hex: 0x240201
    public static RESPONSE_MESSAGE_TYPE = 2359809;
    private static REQUEST_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = CPAtomicRefCompareAndSetCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;

    private CPAtomicRefCompareAndSetCodec() {
    }


    static encodeRequest(groupId: RaftGroupId, name: string, oldValue: Data, newValue: Data) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("CPAtomicRef.CompareAndSet");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(CPAtomicRefCompareAndSetCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPAtomicRefCompareAndSetCodec.REQUEST_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage,  oldValue , DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  newValue , DataCodec.encode );
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        //empty initial frame
        frame = frame.next;
        request.groupId = RaftGroupIdCodec.decode(frame);
        request.name = StringCodec.decode(frame);
        request.oldValue = CodecUtil.decodeNullable(frame, DataCodec.decode);
        request.newValue = CodecUtil.decodeNullable(frame, DataCodec.decode);
        return request;
    }


     static encodeResponse(response: boolean ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(CPAtomicRefCompareAndSetCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPAtomicRefCompareAndSetCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeBoolean(initialFrame.content, CPAtomicRefCompareAndSetCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.response =  FixedSizeTypes.decodeBoolean(initialFrame.content, CPAtomicRefCompareAndSetCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}