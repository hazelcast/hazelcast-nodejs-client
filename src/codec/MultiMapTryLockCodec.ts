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
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import * as Long from 'long';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';

// hex: 0x021100
const REQUEST_MESSAGE_TYPE = 135424;
// hex: 0x021101
// RESPONSE_MESSAGE_TYPE = 135425

const REQUEST_THREAD_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_LEASE_OFFSET = REQUEST_THREAD_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_TIMEOUT_OFFSET = REQUEST_LEASE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_REFERENCE_ID_OFFSET = REQUEST_TIMEOUT_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_REFERENCE_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

/** @internal */
export class MultiMapTryLockCodec {
    static encodeRequest(name: string, key: Data, threadId: Long, lease: Long, timeout: Long, referenceId: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setContainsSerializedDataInRequest(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_THREAD_ID_OFFSET, threadId);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_LEASE_OFFSET, lease);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_TIMEOUT_OFFSET, timeout);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_REFERENCE_ID_OFFSET, referenceId);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, key);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): boolean {
        const initialFrame = clientMessage.nextFrame();

        return FixSizedTypesCodec.decodeBoolean(initialFrame.content, RESPONSE_RESPONSE_OFFSET);
    }
}
