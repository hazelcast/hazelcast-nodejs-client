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
import {DataCodec} from './builtin/DataCodec';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';

// hex: 0x012700
const REQUEST_MESSAGE_TYPE = 75520;
// hex: 0x012701
const RESPONSE_MESSAGE_TYPE = 75521;

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface MapValuesWithPredicateResponseParams {
    response: Data[];
}
export class MapValuesWithPredicateCodec {
    static encodeRequest(name: string, predicate: Data): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, MESSAGE_TYPE_OFFSET, REQUEST_MESSAGE_TYPE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PARTITION_ID_OFFSET, -1);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, predicate);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapValuesWithPredicateResponseParams {
        const iterator = clientMessage.frameIterator();
        // empty initial frame
        iterator.next();

        return {
            response: ListMultiFrameCodec.decode(iterator, DataCodec.decode),
        };
    }
}
