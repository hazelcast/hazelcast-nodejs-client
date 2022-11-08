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
import {Schema} from '../serialization/compact/Schema';
import {SchemaCodec} from './custom/SchemaCodec';
import {SetUUIDCodec} from './builtin/SetUUIDCodec';
import { UUID } from '../core';

// hex: 0x001300
const REQUEST_MESSAGE_TYPE = 4864;
// hex: 0x001301
// RESPONSE_MESSAGE_TYPE = 4865

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class ClientSendSchemaCodec {
    static encodeRequest(schema: Schema): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        SchemaCodec.encode(clientMessage, schema);
        return clientMessage;
    }

    static encodeResponse( replicatedMembers: UUID[] ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);

        SetUUIDCodec.encode(clientMessage, replicatedMembers);
        return clientMessage;
    }

    static decodeResponse( clientMessage: ClientMessage ): Set<UUID> {
        return SetUUIDCodec.decode(clientMessage);
    }
}
