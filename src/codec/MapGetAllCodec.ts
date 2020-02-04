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
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, MESSAGE_TYPE_OFFSET, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {DataCodec} from './builtin/DataCodec';
import {EntryListCodec} from './builtin/EntryListCodec';

// hex: 0x012300
const REQUEST_MESSAGE_TYPE = 74496;
// hex: 0x012301
const RESPONSE_MESSAGE_TYPE = 74497;

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface MapGetAllResponseParams {
    response: Array<[Data, Data]>;
}
export class MapGetAllCodec {
    static encodeRequest(name: string, keys: Data[]): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, MESSAGE_TYPE_OFFSET, REQUEST_MESSAGE_TYPE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PARTITION_ID_OFFSET, -1);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, name);
        ListMultiFrameCodec.encode(clientMessage, keys, DataCodec.encode);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapGetAllResponseParams {
        const iterator = clientMessage.frameIterator();
        // empty initial frame
        iterator.next();

        return {
            response: EntryListCodec.decode(iterator, DataCodec.decode, DataCodec.decode),
        };
    }
}
