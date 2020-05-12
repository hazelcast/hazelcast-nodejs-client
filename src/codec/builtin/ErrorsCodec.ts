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

// Other codecs message types can be in range 0x000100 - 0xFFFFFF
// So, it is safe to supply a custom message type for exceptions in
// the range 0x000000 - 0x0000FF
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, UNFRAGMENTED_MESSAGE} from '../../ClientMessage';
import {BitsUtil} from '../../BitsUtil';
import {Buffer} from 'safe-buffer';
import {ErrorHolder} from '../../protocol/ErrorHolder';
import {ListMultiFrameCodec} from './ListMultiFrameCodec';
import {ErrorHolderCodec} from '../custom/ErrorHolderCodec';

export const EXCEPTION_MESSAGE_TYPE = 0;
const INITIAL_FRAME_SIZE = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

export class ErrorsCodec {
    static encode(errorHolders: ErrorHolder[]): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame = new Frame(Buffer.allocUnsafe(INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        clientMessage.add(initialFrame);
        clientMessage.setMessageType(EXCEPTION_MESSAGE_TYPE);
        ListMultiFrameCodec.encode(clientMessage, errorHolders, ErrorHolderCodec.encode);
        return clientMessage;
    }

    static decode(clientMessage: ClientMessage): ErrorHolder[] {
        const iterator = clientMessage.frameIterator();
        // initial frame
        iterator.next();
        return ListMultiFrameCodec.decode(iterator, ErrorHolderCodec.decode);
    }
}
