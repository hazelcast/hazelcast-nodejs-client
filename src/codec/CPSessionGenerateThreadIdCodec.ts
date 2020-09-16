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
import * as Long from 'long';

// hex: 0x1F0400
const REQUEST_MESSAGE_TYPE = 2032640;
// hex: 0x1F0401
// RESPONSE_MESSAGE_TYPE = 2032641

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;


/** @internal */
export class CPSessionGenerateThreadIdCodec {
    static encodeRequest(groupId: RaftGroupId): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        RaftGroupIdCodec.encode(clientMessage, groupId);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): Long {
        const initialFrame = clientMessage.nextFrame();

        return FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_RESPONSE_OFFSET);
    }
}
