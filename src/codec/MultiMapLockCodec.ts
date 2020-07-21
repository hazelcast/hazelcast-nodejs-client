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
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, PARTITION_ID_OFFSET} from '../ClientMessage';
import * as Long from 'long';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';

// hex: 0x021000
const REQUEST_MESSAGE_TYPE = 135168;
// hex: 0x021001
// RESPONSE_MESSAGE_TYPE = 135169

const REQUEST_THREAD_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_TTL_OFFSET = REQUEST_THREAD_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_REFERENCE_ID_OFFSET = REQUEST_TTL_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_REFERENCE_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

export class MultiMapLockCodec {
    static encodeRequest(name: string, key: Data, threadId: Long, ttl: Long, referenceId: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_THREAD_ID_OFFSET, threadId);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_TTL_OFFSET, ttl);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_REFERENCE_ID_OFFSET, referenceId);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, key);
        return clientMessage;
    }
}
