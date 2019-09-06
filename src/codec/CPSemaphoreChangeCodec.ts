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
     * CP group id of this ISemaphore instance
     */
    public groupId: RaftGroupId;

    /**
     * Name of this ISemaphore instance
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
     * number of permits to increase / decrease
     */
    public permits: number;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * true
     */
    public response: boolean;
}

/**
 * Increases or decreases the number of permits by the given value.
 */
/* tslint:disable:max-line-length no-bitwise */
export class CPSemaphoreChangeCodec {
    // hex: 0x270500
    public static REQUEST_MESSAGE_TYPE = 2557184;
    // hex: 0x270501
    public static RESPONSE_MESSAGE_TYPE = 2557185;
    private static REQUEST_SESSION_ID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_THREAD_ID_FIELD_OFFSET = CPSemaphoreChangeCodec.REQUEST_SESSION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_INVOCATION_UID_FIELD_OFFSET = CPSemaphoreChangeCodec.REQUEST_THREAD_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static REQUEST_PERMITS_FIELD_OFFSET = CPSemaphoreChangeCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CPSemaphoreChangeCodec.REQUEST_PERMITS_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_RESPONSE_FIELD_OFFSET = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = CPSemaphoreChangeCodec.RESPONSE_RESPONSE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;

    static encodeRequest(groupId: RaftGroupId, name: string, sessionId: Long, threadId: Long, invocationUid: UUID, permits: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('CPSemaphore.Change');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CPSemaphoreChangeCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPSemaphoreChangeCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, CPSemaphoreChangeCodec.REQUEST_SESSION_ID_FIELD_OFFSET, sessionId);
        FixedSizeTypes.encodeLong(initialFrame.content, CPSemaphoreChangeCodec.REQUEST_THREAD_ID_FIELD_OFFSET, threadId);
        FixedSizeTypes.encodeUUID(initialFrame.content, CPSemaphoreChangeCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET, invocationUid);
        FixedSizeTypes.encodeInt(initialFrame.content, CPSemaphoreChangeCodec.REQUEST_PERMITS_FIELD_OFFSET, permits);
        clientMessage.add(initialFrame);
        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.sessionId =  FixedSizeTypes.decodeLong(initialFrame.content, CPSemaphoreChangeCodec.REQUEST_SESSION_ID_FIELD_OFFSET);
        request.threadId =  FixedSizeTypes.decodeLong(initialFrame.content, CPSemaphoreChangeCodec.REQUEST_THREAD_ID_FIELD_OFFSET);
        request.invocationUid =  FixedSizeTypes.decodeUUID(initialFrame.content, CPSemaphoreChangeCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET);
        request.permits =  FixedSizeTypes.decodeInt(initialFrame.content, CPSemaphoreChangeCodec.REQUEST_PERMITS_FIELD_OFFSET);
        request.groupId = RaftGroupIdCodec.decode(frame);
        request.name = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: boolean ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CPSemaphoreChangeCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPSemaphoreChangeCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        FixedSizeTypes.encodeBoolean(initialFrame.content, CPSemaphoreChangeCodec.RESPONSE_RESPONSE_FIELD_OFFSET, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response =  FixedSizeTypes.decodeBoolean(initialFrame.content, CPSemaphoreChangeCodec.RESPONSE_RESPONSE_FIELD_OFFSET);
        return response;
    }
}
