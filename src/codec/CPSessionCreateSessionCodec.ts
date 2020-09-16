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

// hex: 0x1F0100
const REQUEST_MESSAGE_TYPE = 2031872;
// hex: 0x1F0101
// RESPONSE_MESSAGE_TYPE = 2031873

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_SESSION_ID_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_TTL_MILLIS_OFFSET = RESPONSE_SESSION_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_HEARTBEAT_MILLIS_OFFSET = RESPONSE_TTL_MILLIS_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;


/** @internal */
export interface CPSessionCreateSessionResponseParams {
    sessionId: Long;
    ttlMillis: Long;
    heartbeatMillis: Long;
}

/** @internal */
export class CPSessionCreateSessionCodec {
    static encodeRequest(groupId: RaftGroupId, endpointName: string): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, endpointName);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): CPSessionCreateSessionResponseParams {
        const initialFrame = clientMessage.nextFrame();

        const response = {} as CPSessionCreateSessionResponseParams;
        response.sessionId = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_SESSION_ID_OFFSET);
        response.ttlMillis = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_TTL_MILLIS_OFFSET);
        response.heartbeatMillis = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_HEARTBEAT_MILLIS_OFFSET);

        return response;
    }
}
