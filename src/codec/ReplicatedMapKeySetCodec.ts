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
import {ClientMessage, Frame, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {DataCodec} from './builtin/DataCodec';

// hex: 0x0D0F00
const REQUEST_MESSAGE_TYPE = 855808;
// hex: 0x0D0F01
const RESPONSE_MESSAGE_TYPE = 855809;

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface ReplicatedMapKeySetResponseParams {
    response: Data[];
}
export class ReplicatedMapKeySetCodec {
    static encodeRequest(name: string): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): ReplicatedMapKeySetResponseParams {
        // empty initial frame
        clientMessage.nextFrame();

        return {
            response: ListMultiFrameCodec.decode(clientMessage, DataCodec.decode),
        };
    }
}
