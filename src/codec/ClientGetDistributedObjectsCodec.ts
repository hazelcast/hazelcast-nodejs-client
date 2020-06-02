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
import {DistributedObjectInfo} from '../DistributedObjectInfo';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {DistributedObjectInfoCodec} from './custom/DistributedObjectInfoCodec';

// hex: 0x000800
const REQUEST_MESSAGE_TYPE = 2048;
// hex: 0x000801
const RESPONSE_MESSAGE_TYPE = 2049;

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface ClientGetDistributedObjectsResponseParams {
    response: DistributedObjectInfo[];
}
export class ClientGetDistributedObjectsCodec {
    static encodeRequest(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): ClientGetDistributedObjectsResponseParams {
        const iterator = clientMessage.frameIterator();
        // empty initial frame
        iterator.getNextFrame();

        return {
            response: ListMultiFrameCodec.decode(iterator, DistributedObjectInfoCodec.decode),
        };
    }
}
