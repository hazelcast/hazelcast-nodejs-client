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
import {BitsUtil} from '../util/BitsUtil';
import {ClientMessage, Frame, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import {DistributedObjectInfo} from '../core/DistributedObjectInfo';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {DistributedObjectInfoCodec} from './custom/DistributedObjectInfoCodec';

// hex: 0x000800
const REQUEST_MESSAGE_TYPE = 2048;
// hex: 0x000801
// RESPONSE_MESSAGE_TYPE = 2049

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export interface ClientGetDistributedObjectsResponseParams {
    response: DistributedObjectInfo[];
}

/** @internal */
export class ClientGetDistributedObjectsCodec {
    static encodeRequest(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): ClientGetDistributedObjectsResponseParams {
        // empty initial frame
        clientMessage.nextFrame();

        const response = {} as ClientGetDistributedObjectsResponseParams;
        response.response = ListMultiFrameCodec.decode(clientMessage, DistributedObjectInfoCodec.decode);

        return response;
    }
}
