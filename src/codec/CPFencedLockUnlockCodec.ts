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
         * CP group id of this FencedLock instance
         */
        public groupId: RaftGroupId;

        /**
         * Name of this FencedLock instance
         */
        public name: string;

        /**
         * Session ID of the caller
         */
        public sessionId: Long;

        /**
         * ID of the caller thread
         */
        public threadId: Long;

        /**
         * UID of this invocation
         */
        public invocationUid: UUID;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * true if the lock is still held by the caller after
         * a successful unlock() call, false otherwise.
         */
        public response : boolean;
    };

/**
 * Unlocks the given FencedLock on the given CP group. If the lock is
 * not acquired, the call fails with {@link IllegalMonitorStateException}.
 * If the session is closed while holding the lock, the call fails with
 * {@code LockOwnershipLostException}. Returns true if the lock is still
 * held by the caller after a successful unlock() call, false otherwise.
 */
export class CPFencedLockUnlockCodec {
    //hex: 0x260300
    public static REQUEST_MESSAGE_TYPE = 2491136;
    //hex: 0x260301
    public static RESPONSE_MESSAGE_TYPE = 2491137;
    private static REQUEST_SESSION_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_THREAD_ID_FIELD_OFFSET = CPFencedLockUnlockCodec.REQUEST_SESSION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INVOCATION_UID_FIELD_OFFSET = CPFencedLockUnlockCodec.REQUEST_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CPFencedLockUnlockCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = CPFencedLockUnlockCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;

    private CPFencedLockUnlockCodec() {
    }


    static encodeRequest(groupId: RaftGroupId, name: string, sessionId: Long, threadId: Long, invocationUid: UUID) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("CPFencedLock.Unlock");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(CPFencedLockUnlockCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPFencedLockUnlockCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockUnlockCodec.REQUEST_SESSION_ID_FIELD_OFFSET, sessionId);
        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockUnlockCodec.REQUEST_THREAD_ID_FIELD_OFFSET, threadId);
        FixedSizeTypes.encodeUUID(initialFrame.content, CPFencedLockUnlockCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET, invocationUid);
        clientMessage.add(initialFrame);
        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.sessionId =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockUnlockCodec.REQUEST_SESSION_ID_FIELD_OFFSET);
        request.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockUnlockCodec.REQUEST_THREAD_ID_FIELD_OFFSET);
        request.invocationUid =  FixedSizeTypes.decodeUUID(initialFrame.content, CPFencedLockUnlockCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET);
        request.groupId = RaftGroupIdCodec.decode(frame);
        request.name = StringCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: boolean ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(CPFencedLockUnlockCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPFencedLockUnlockCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeBoolean(initialFrame.content, CPFencedLockUnlockCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        var initialFrame : Frame = frame.next;
        response.response =  FixedSizeTypes.decodeBoolean(initialFrame.content, CPFencedLockUnlockCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }


static handle(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
        }
}