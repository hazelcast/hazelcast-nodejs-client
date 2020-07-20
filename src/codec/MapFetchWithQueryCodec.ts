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
import {ClientMessage, Frame, PARTITION_ID_OFFSET} from '../ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {EntryListIntegerIntegerCodec} from './builtin/EntryListIntegerIntegerCodec';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';

// hex: 0x014000
const REQUEST_MESSAGE_TYPE = 81920;
// hex: 0x014001
// RESPONSE_MESSAGE_TYPE = 81921

const REQUEST_BATCH_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_BATCH_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface MapFetchWithQueryResponseParams {
    results: Data[];
    iterationPointers: Array<[number, number]>;
}

export class MapFetchWithQueryCodec {
    static encodeRequest(name: string, iterationPointers: Array<[number, number]>, batch: number, projection: Data, predicate: Data): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_BATCH_OFFSET, batch);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        EntryListIntegerIntegerCodec.encode(clientMessage, iterationPointers);
        DataCodec.encode(clientMessage, projection);
        DataCodec.encode(clientMessage, predicate);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapFetchWithQueryResponseParams {
        // empty initial frame
        clientMessage.nextFrame();

        return {
            results: ListMultiFrameCodec.decodeContainsNullable(clientMessage, DataCodec.decode),
            iterationPointers: EntryListIntegerIntegerCodec.decode(clientMessage),
        };
    }
}
