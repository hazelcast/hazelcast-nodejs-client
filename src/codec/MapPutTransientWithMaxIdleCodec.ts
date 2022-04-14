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
import * as Long from 'long';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';
import {CodecUtil} from './builtin/CodecUtil';

// hex: 0x014500
const REQUEST_MESSAGE_TYPE = 83200;
// hex: 0x014501
// RESPONSE_MESSAGE_TYPE = 83201

const REQUEST_THREAD_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_TTL_OFFSET = REQUEST_THREAD_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_MAX_IDLE_OFFSET = REQUEST_TTL_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_MAX_IDLE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

/** @internal */
export class MapPutTransientWithMaxIdleCodec {
    static encodeRequest(name: string, key: Data, value: Data, threadId: Long, ttl: Long, maxIdle: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_THREAD_ID_OFFSET, threadId);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_TTL_OFFSET, ttl);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_MAX_IDLE_OFFSET, maxIdle);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, key);
        DataCodec.encode(clientMessage, value);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): Data {
        // empty initial frame
        clientMessage.nextFrame();

        return CodecUtil.decodeNullable(clientMessage, DataCodec.decode);
    }
}
