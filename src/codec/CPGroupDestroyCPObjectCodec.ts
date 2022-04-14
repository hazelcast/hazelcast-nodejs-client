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
import {ClientMessage, Frame, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import {RaftGroupId} from '../proxy/cpsubsystem/RaftGroupId';
import {RaftGroupIdCodec} from './custom/RaftGroupIdCodec';
import {StringCodec} from './builtin/StringCodec';

// hex: 0x1E0200
const REQUEST_MESSAGE_TYPE = 1966592;
// hex: 0x1E0201
// RESPONSE_MESSAGE_TYPE = 1966593

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class CPGroupDestroyCPObjectCodec {
    static encodeRequest(groupId: RaftGroupId, serviceName: string, objectName: string): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, serviceName);
        StringCodec.encode(clientMessage, objectName);
        return clientMessage;
    }
}
