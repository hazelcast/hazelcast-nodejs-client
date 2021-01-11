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
import {StringCodec} from './builtin/StringCodec';
import {EntryListCodec} from './builtin/EntryListCodec';
import {DataCodec} from './builtin/DataCodec';
import {Data} from '../serialization/Data';

// hex: 0x012C00
const REQUEST_MESSAGE_TYPE = 76800;
// hex: 0x012C01
// RESPONSE_MESSAGE_TYPE = 76801

const REQUEST_TRIGGER_MAP_LOADER_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_TRIGGER_MAP_LOADER_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;

/** @internal */
export class MapPutAllCodec {
    static encodeRequest(name: string, entries: Array<[Data, Data]>, triggerMapLoader: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_TRIGGER_MAP_LOADER_OFFSET, triggerMapLoader);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        EntryListCodec.encode(clientMessage, entries, DataCodec.encode, DataCodec.encode);
        return clientMessage;
    }
}
