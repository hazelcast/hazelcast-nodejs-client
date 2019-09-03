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
         * CP group id of this CountDownLatch instance
         */
        public groupId: RaftGroupId;

        /**
         * Name of this CountDownLatch instance
         */
        public name: string;

        /**
         * UID of this invocation
         */
        public invocationUid: UUID;

        /**
         * The maximum time in milliseconds to wait
         */
        public timeoutMs: Long;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * true if the count reached zero, false if
         * the waiting time elapsed before the count reached 0
         */
        public response : boolean;
    };

/**
 * Causes the current thread to wait until the latch has counted down
 * to zero, or an exception is thrown, or the specified waiting time
 * elapses. If the current count is zero then this method returns
 * immediately with the value true. If the current count is greater than
 * zero, then the current thread becomes disabled for thread scheduling
 * purposes and lies dormant until one of five things happen: the count
 * reaches zero due to invocations of the {@code countDown} method, this
 * ICountDownLatch instance is destroyed, the countdown owner becomes
 * disconnected, some other thread Thread#interrupt interrupts the current
 * thread, or the specified waiting time elapses. If the count reaches zero
 * then the method returns with the value true. If the current thread has
 * its interrupted status set on entry to this method, or is interrupted
 * while waiting, then {@code InterruptedException} is thrown
 * and the current thread's interrupted status is cleared. If the specified
 * waiting time elapses then the value false is returned.  If the time is
 * less than or equal to zero, the method will not wait at all.
 */
export class CPCountDownLatchAwaitCodec {
    //hex: 0x250200
    public static REQUEST_MESSAGE_TYPE = 2425344;
    //hex: 0x250201
    public static RESPONSE_MESSAGE_TYPE = 2425345;
    private static REQUEST_INVOCATION_UID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_TIMEOUT_MS_FIELD_OFFSET = CPCountDownLatchAwaitCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CPCountDownLatchAwaitCodec.REQUEST_TIMEOUT_MS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = CPCountDownLatchAwaitCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;

    private CPCountDownLatchAwaitCodec() {
    }


    static encodeRequest(groupId: RaftGroupId, name: string, invocationUid: UUID, timeoutMs: Long) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("CPCountDownLatch.Await");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(CPCountDownLatchAwaitCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPCountDownLatchAwaitCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeUUID(initialFrame.content, CPCountDownLatchAwaitCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET, invocationUid);
        FixedSizeTypes.encodeLong(initialFrame.content, CPCountDownLatchAwaitCodec.REQUEST_TIMEOUT_MS_FIELD_OFFSET, timeoutMs);
        clientMessage.add(initialFrame);
        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.invocationUid =  FixedSizeTypes.decodeUUID(initialFrame.content, CPCountDownLatchAwaitCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET);
        request.timeoutMs =  FixedSizeTypes.decodeLong(initialFrame.content, CPCountDownLatchAwaitCodec.REQUEST_TIMEOUT_MS_FIELD_OFFSET);
        request.groupId = RaftGroupIdCodec.decode(frame);
        request.name = StringCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: boolean ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(CPCountDownLatchAwaitCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPCountDownLatchAwaitCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeBoolean(initialFrame.content, CPCountDownLatchAwaitCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.response =  FixedSizeTypes.decodeBoolean(initialFrame.content, CPCountDownLatchAwaitCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }


static handle(clientMessage : ClientMessage, handleEventEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}