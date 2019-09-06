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
     * CP group id of this CountDownLatch instance
     */
    public groupId: RaftGroupId;

    /**
     * Name of the CountDownLatch instance
     */
    public name: string;

    /**
     * UID of this invocation
     */
    public invocationUid: UUID;

    /**
     * The round this invocation will be performed on
     */
    public expectedRound: number;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {
}

/**
 * Decrements the count of the latch, releasing all waiting threads if
 * the count reaches zero. If the current count is greater than zero, then
 * it is decremented. If the new count is zero: All waiting threads are
 * re-enabled for thread scheduling purposes, and Countdown owner is set to
 * null. If the current count equals zero, then nothing happens.
 */
/* tslint:disable:max-line-length no-bitwise */
export class CPCountDownLatchCountDownCodec {
    // hex: 0x250300
    public static REQUEST_MESSAGE_TYPE = 2425600;
    // hex: 0x250301
    public static RESPONSE_MESSAGE_TYPE = 2425601;
    private static REQUEST_INVOCATION_UID_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_EXPECTED_ROUND_FIELD_OFFSET = CPCountDownLatchCountDownCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = CPCountDownLatchCountDownCodec.REQUEST_EXPECTED_ROUND_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;

    static encodeRequest(groupId: RaftGroupId, name: string, invocationUid: UUID, expectedRound: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('CPCountDownLatch.CountDown');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CPCountDownLatchCountDownCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPCountDownLatchCountDownCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeUUID(initialFrame.content, CPCountDownLatchCountDownCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET, invocationUid);
        FixedSizeTypes.encodeInt(initialFrame.content, CPCountDownLatchCountDownCodec.REQUEST_EXPECTED_ROUND_FIELD_OFFSET, expectedRound);
        clientMessage.add(initialFrame);
        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.invocationUid =  FixedSizeTypes.decodeUUID(initialFrame.content, CPCountDownLatchCountDownCodec.REQUEST_INVOCATION_UID_FIELD_OFFSET);
        request.expectedRound =  FixedSizeTypes.decodeInt(initialFrame.content, CPCountDownLatchCountDownCodec.REQUEST_EXPECTED_ROUND_FIELD_OFFSET);
        request.groupId = RaftGroupIdCodec.decode(frame);
        request.name = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(CPCountDownLatchCountDownCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, CPCountDownLatchCountDownCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        return response;
    }
}
