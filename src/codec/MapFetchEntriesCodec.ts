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

/*tslint:disable:max-line-length*/
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {EntryListIntegerIntegerCodec} from './builtin/EntryListIntegerIntegerCodec';
import {EntryListCodec} from './builtin/EntryListCodec';
import {DataCodec} from './builtin/DataCodec';
import {Data} from '../serialization/Data';

// hex: 0x013800
const REQUEST_MESSAGE_TYPE = 79872;
// hex: 0x013801
const RESPONSE_MESSAGE_TYPE = 79873;

const REQUEST_BATCH_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_BATCH_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface MapFetchEntriesResponseParams {
    iterationPointers: Array<[number, number]>;
    entries: Array<[Data, Data]>;
}

export class MapFetchEntriesCodec {
    static encodeRequest(name: string, iterationPointers: Array<[number, number]>, batch: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE, UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_BATCH_OFFSET, batch);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        EntryListIntegerIntegerCodec.encode(clientMessage, iterationPointers);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapFetchEntriesResponseParams {
        // empty initial frame
        clientMessage.nextFrame();

        return {
            iterationPointers: EntryListIntegerIntegerCodec.decode(clientMessage),
            entries: EntryListCodec.decode(clientMessage, DataCodec.decode, DataCodec.decode),
        };
    }
}
