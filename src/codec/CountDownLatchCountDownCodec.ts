/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
import {ClientMessage, Frame, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import {UUID} from '../core/UUID';
import {RaftGroupId} from '../proxy/cpsubsystem/RaftGroupId';
import {RaftGroupIdCodec} from './custom/RaftGroupIdCodec';
import {StringCodec} from './builtin/StringCodec';

// hex: 0x0B0300
const REQUEST_MESSAGE_TYPE = 721664;
// hex: 0x0B0301
// RESPONSE_MESSAGE_TYPE = 721665

const REQUEST_INVOCATION_UID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_EXPECTED_ROUND_OFFSET = REQUEST_INVOCATION_UID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_EXPECTED_ROUND_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class CountDownLatchCountDownCodec {
    static encodeRequest(groupId: RaftGroupId, name: string, invocationUid: UUID, expectedRound: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeUUID(initialFrame.content, REQUEST_INVOCATION_UID_OFFSET, invocationUid);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_EXPECTED_ROUND_OFFSET, expectedRound);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }
}
