/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

/* eslint-disable max-len */
import {BitsUtil} from '../util/BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import {RaftGroupId} from '../proxy/cpsubsystem/RaftGroupId';
import {RaftGroupIdCodec} from './custom/RaftGroupIdCodec';
import {StringCodec} from './builtin/StringCodec';
import * as Long from 'long';

// hex: 0x070400
const REQUEST_MESSAGE_TYPE = 459776;
// hex: 0x070401
// RESPONSE_MESSAGE_TYPE = 459777

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_FENCE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_LOCK_COUNT_OFFSET = RESPONSE_FENCE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_SESSION_ID_OFFSET = RESPONSE_LOCK_COUNT_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_THREAD_ID_OFFSET = RESPONSE_SESSION_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

/** @internal */
export interface FencedLockGetLockOwnershipResponseParams {
    fence: Long;
    lockCount: number;
    sessionId: Long;
    threadId: Long;
}

/** @internal */
export class FencedLockGetLockOwnershipCodec {
    static encodeRequest(groupId: RaftGroupId, name: string): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): FencedLockGetLockOwnershipResponseParams {
        const initialFrame = clientMessage.nextFrame();

        const response = {} as FencedLockGetLockOwnershipResponseParams;
        response.fence = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_FENCE_OFFSET);
        response.lockCount = FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_LOCK_COUNT_OFFSET);
        response.sessionId = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_SESSION_ID_OFFSET);
        response.threadId = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_THREAD_ID_OFFSET);

        return response;
    }
}
