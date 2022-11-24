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
import {StringCodec} from './builtin/StringCodec';
import {EntryListCodec} from './builtin/EntryListCodec';
import {DataCodec} from './builtin/DataCodec';
import {ListDataCodec} from './builtin/ListDataCodec';
import {Data} from '../serialization/Data';

// hex: 0x021700
const REQUEST_MESSAGE_TYPE = 136960;
// hex: 0x021701
// RESPONSE_MESSAGE_TYPE = 136961

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class MultiMapPutAllCodec {
    static encodeRequest(name: string, entries: Array<[Data, Data[]]>): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setContainsSerializedDataInRequest(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        EntryListCodec.encode(clientMessage, entries, DataCodec.encode, ListDataCodec.encode);
        return clientMessage;
    }
}
