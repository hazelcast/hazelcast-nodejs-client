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

    /**
     * Duration to wait for lock acquire
     */
    public timeoutMs: Long;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * a valid fencing token (positive number) if the lock
     * is acquired, otherwise -1.
     */
    public response: Long;
}

/**
 * Attempts to acquire the given FencedLock on the given CP group.
 * If the lock is acquired, a valid fencing token (positive number) is
 * returned. If not acquired either because of max reentrant entry limit or
 * the lock is not free during the timeout duration, the call returns -1.
 * If the lock is held by some other endpoint when this method is called,
 * the caller thread is blocked until the lock is released or the timeout
 * duration passes. If the session is closed between reentrant acquires,
 * the call fails with {@code LockOwnershipLostException}.
 */
/* tslint:disable:max-line-length no-bitwise */
export class CPFencedLockTryLockCodec {
    // hex: 0x260200
    public static REQUEST_MESSAGE_TYPE = 2490880;
    // hex: 0x260201
    public static RESPONSE_MESSAGE_TYPE = 2490881;
    private static REQUEST_SESSION_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_THREAD_ID_FIELD_OFFSET = CPFencedLockTryLockCodec.REQUEST_SESSION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INVOCATION_UID_FIELD_OFFSET = CPFencedLockTryLockCodec.REQUEST_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_TIMEOUT_MS_FIELD_OFFSET = CPFencedLockTryLockCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CPFencedLockTryLockCodec.REQUEST_TIMEOUT_MS_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = CPFencedLockTryLockCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(groupId: RaftGroupId, name: string, sessionId: Long, threadId: Long, invocationUid: UUID, timeoutMs: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('CPFencedLock.TryLock');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CPFencedLockTryLockCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPFencedLockTryLockCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockTryLockCodec.REQUEST_SESSION_ID_FIELD_OFFSET, sessionId);
        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockTryLockCodec.REQUEST_THREAD_ID_FIELD_OFFSET, threadId);
        FixedSizeTypes.encodeUUID(initialFrame.content, CPFencedLockTryLockCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET, invocationUid);
        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockTryLockCodec.REQUEST_TIMEOUT_MS_FIELD_OFFSET, timeoutMs);
        clientMessage.add(initialFrame);
        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.sessionId =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockTryLockCodec.REQUEST_SESSION_ID_FIELD_OFFSET);
        request.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockTryLockCodec.REQUEST_THREAD_ID_FIELD_OFFSET);
        request.invocationUid =  FixedSizeTypes.decodeUUID(initialFrame.content, CPFencedLockTryLockCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET);
        request.timeoutMs =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockTryLockCodec.REQUEST_TIMEOUT_MS_FIELD_OFFSET);
        request.groupId = RaftGroupIdCodec.decode(frame);
        request.name = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: Long ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CPFencedLockTryLockCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPFencedLockTryLockCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockTryLockCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockTryLockCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }
}
