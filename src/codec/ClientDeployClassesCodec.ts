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
import {ClientMessage, Frame, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import {EntryListCodec} from './builtin/EntryListCodec';
import {StringCodec} from './builtin/StringCodec';
import {ByteArrayCodec} from './builtin/ByteArrayCodec';

// hex: 0x000D00
const REQUEST_MESSAGE_TYPE = 3328;
// hex: 0x000D01
// RESPONSE_MESSAGE_TYPE = 3329

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class ClientDeployClassesCodec {
    static encodeRequest(classDefinitions: Array<[string, Buffer]>): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        EntryListCodec.encode(clientMessage, classDefinitions, StringCodec.encode, ByteArrayCodec.encode);
        return clientMessage;
    }
}
