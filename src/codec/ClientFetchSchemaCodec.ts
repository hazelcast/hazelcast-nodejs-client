/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
import * as Long from 'long';
import {Schema} from '../serialization/compact/Schema';
import {SchemaCodec} from './custom/SchemaCodec';
import {CodecUtil} from './builtin/CodecUtil';

// hex: 0x001400
const REQUEST_MESSAGE_TYPE = 5120;
// hex: 0x001401
// RESPONSE_MESSAGE_TYPE = 5121

const REQUEST_SCHEMA_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_SCHEMA_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

/** @internal */
export class ClientFetchSchemaCodec {
    static encodeRequest(schemaId: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_SCHEMA_ID_OFFSET, schemaId);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): Schema {
        // empty initial frame
        clientMessage.nextFrame();

        return CodecUtil.decodeNullable(clientMessage, SchemaCodec.decode);
    }
}
