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
         * Name of the Condition
         */
        public name: string;

        /**
         * The id of the user thread performing the operation. It is used to guarantee that only the lock holder thread (if a lock exists on the entry) can perform the requested operation.
         */
        public threadId: Long;

        /**
         * The maximum time to wait
         */
        public timeout: Long;

        /**
         * Name of the lock to wait on.
         */
        public lockName: string;

        /**
         * The client-wide unique id for this request. It is used to make the request idempotent by sending the same reference id during retries.
         */
        public referenceId: Long;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * False if the waiting time detectably elapsed before return from the method, else true
         */
        public response : boolean;
    };

/**
 * Causes the current thread to wait until it is signalled or interrupted, or the specified waiting time elapses.
 */
export class ConditionAwaitCodec {
    //hex: 0x080100
    public static REQUEST_MESSAGE_TYPE = 524544;
    //hex: 0x080101
    public static RESPONSE_MESSAGE_TYPE = 524545;
    private static REQUEST_THREAD_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_TIMEOUT_FIELD_OFFSET = ConditionAwaitCodec.REQUEST_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_REFERENCE_ID_FIELD_OFFSET = ConditionAwaitCodec.REQUEST_TIMEOUT_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = ConditionAwaitCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ConditionAwaitCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;

    private ConditionAwaitCodec() {
    }


    static encodeRequest(name: string, threadId: Long, timeout: Long, lockName: string, referenceId: Long) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Condition.Await");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(ConditionAwaitCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ConditionAwaitCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, ConditionAwaitCodec.REQUEST_THREAD_ID_FIELD_OFFSET, threadId);
        FixedSizeTypes.encodeLong(initialFrame.content, ConditionAwaitCodec.REQUEST_TIMEOUT_FIELD_OFFSET, timeout);
        FixedSizeTypes.encodeLong(initialFrame.content, ConditionAwaitCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET, referenceId);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        StringCodec.encode(clientMessage, lockName);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, ConditionAwaitCodec.REQUEST_THREAD_ID_FIELD_OFFSET);
        request.timeout =  FixedSizeTypes.decodeLong(initialFrame.content, ConditionAwaitCodec.REQUEST_TIMEOUT_FIELD_OFFSET);
        request.referenceId =  FixedSizeTypes.decodeLong(initialFrame.content, ConditionAwaitCodec.REQUEST_REFERENCE_ID_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.lockName = StringCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: boolean ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ConditionAwaitCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ConditionAwaitCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeBoolean(initialFrame.content, ConditionAwaitCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.response =  FixedSizeTypes.decodeBoolean(initialFrame.content, ConditionAwaitCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}