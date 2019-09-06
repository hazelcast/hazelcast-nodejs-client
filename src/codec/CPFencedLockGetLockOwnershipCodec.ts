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
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * TODO DOC
     */
    public fence: Long;

    /**
     * TODO DOC
     */
    public lockCount: number;

    /**
     * TODO DOC
     */
    public sessionId: Long;

    /**
     * TODO DOC
     */
    public threadId: Long;
}

/**
 * Returns current lock ownership status of the given FencedLock instance.
 */
/* tslint:disable:max-line-length no-bitwise */
export class CPFencedLockGetLockOwnershipCodec {
    // hex: 0x260400
    public static REQUEST_MESSAGE_TYPE = 2491392;
    // hex: 0x260401
    public static RESPONSE_MESSAGE_TYPE = 2491393;
    private static REQUEST_INITIAL_FRAME_SIZE = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_FENCE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_LOCK_COUNT_FIELD_OFFSET = CPFencedLockGetLockOwnershipCodec.RESPONSE_FENCE_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_SESSION_ID_FIELD_OFFSET = CPFencedLockGetLockOwnershipCodec.RESPONSE_LOCK_COUNT_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_THREAD_ID_FIELD_OFFSET = CPFencedLockGetLockOwnershipCodec.RESPONSE_SESSION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = CPFencedLockGetLockOwnershipCodec.RESPONSE_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(groupId: RaftGroupId, name: string): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('CPFencedLock.GetLockOwnership');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CPFencedLockGetLockOwnershipCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPFencedLockGetLockOwnershipCodec.REQUEST_MESSAGE_TYPE);
        clientMessage.add(initialFrame);
        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        // empty initial frame
        let frame: Frame = clientMessage.get();
        frame = frame.next;
        request.groupId = RaftGroupIdCodec.decode(frame);
        request.name = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(fence: Long , lockCount: number , sessionId: Long , threadId: Long ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CPFencedLockGetLockOwnershipCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPFencedLockGetLockOwnershipCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockGetLockOwnershipCodec.RESPONSE_FENCE_FIELD_OFFSET, fence);
        FixedSizeTypes.encodeInt(initialFrame.content, CPFencedLockGetLockOwnershipCodec.RESPONSE_LOCK_COUNT_FIELD_OFFSET, lockCount);
        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockGetLockOwnershipCodec.RESPONSE_SESSION_ID_FIELD_OFFSET, sessionId);
        FixedSizeTypes.encodeLong(initialFrame.content, CPFencedLockGetLockOwnershipCodec.RESPONSE_THREAD_ID_FIELD_OFFSET, threadId);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.fence =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockGetLockOwnershipCodec.RESPONSE_FENCE_FIELD_OFFSET);
        response.lockCount =  FixedSizeTypes.decodeInt(initialFrame.content, CPFencedLockGetLockOwnershipCodec.RESPONSE_LOCK_COUNT_FIELD_OFFSET);
        response.sessionId =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockGetLockOwnershipCodec.RESPONSE_SESSION_ID_FIELD_OFFSET);
        response.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, CPFencedLockGetLockOwnershipCodec.RESPONSE_THREAD_ID_FIELD_OFFSET);
        return response;
    }
}
