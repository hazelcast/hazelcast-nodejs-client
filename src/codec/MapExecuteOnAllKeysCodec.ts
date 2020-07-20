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
import {ClientMessage, Frame, PARTITION_ID_OFFSET} from '../ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';
import {EntryListCodec} from './builtin/EntryListCodec';

// hex: 0x013000
const REQUEST_MESSAGE_TYPE = 77824;
// hex: 0x013001
// RESPONSE_MESSAGE_TYPE = 77825

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface MapExecuteOnAllKeysResponseParams {
    response: Array<[Data, Data]>;
}

export class MapExecuteOnAllKeysCodec {
    static encodeRequest(name: string, entryProcessor: Data): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, entryProcessor);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapExecuteOnAllKeysResponseParams {
        // empty initial frame
        clientMessage.nextFrame();

        return {
            response: EntryListCodec.decode(clientMessage, DataCodec.decode, DataCodec.decode),
        };
    }
}
