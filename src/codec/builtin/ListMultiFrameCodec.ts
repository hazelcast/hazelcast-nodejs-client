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

import {BEGIN_FRAME, ClientMessage, END_FRAME, NULL_FRAME} from '../../protocol/ClientMessage';
import {CodecUtil} from './CodecUtil';

/** @internal */
export class ListMultiFrameCodec {
    static encode<T>(clientMessage: ClientMessage, list: T[], encoder: (msg: ClientMessage, value: T) => void): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());
        for (let i = 0, n = list.length; i < n; i++) {
            encoder(clientMessage, list[i]);
        }
        clientMessage.addFrame(END_FRAME.copy());
    }

    static encodeContainsNullable<T>(clientMessage: ClientMessage, list: T[],
                                     encoder: (msg: ClientMessage, value: T) => void): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());
        for (let i = 0, n = list.length; i < n; i++) {
            const item = list[i];
            if (item === null) {
                clientMessage.addFrame(NULL_FRAME.copy());
            } else {
                encoder(clientMessage, list[i]);
            }
        }
        clientMessage.addFrame(END_FRAME.copy());
    }

    static encodeNullable<T>(clientMessage: ClientMessage, list: T[], encoder: (msg: ClientMessage, value: T) => void): void {
        if (list === null) {
            clientMessage.addFrame(NULL_FRAME.copy());
        } else {
            this.encode(clientMessage, list, encoder);
        }
    }

    static decode<T>(clientMessage: ClientMessage, decoder: (msg: ClientMessage) => T): T[] {
        const result: T[] = [];
        // begin frame
        clientMessage.nextFrame();
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(clientMessage)) {
            result.push(decoder(clientMessage));
        }
        // end frame
        clientMessage.nextFrame();
        return result;
    }

    static decodeNullable<T>(clientMessage: ClientMessage, decoder: (msg: ClientMessage) => T): T[] {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : ListMultiFrameCodec.decode(clientMessage, decoder);
    }

    static decodeContainsNullable<T>(clientMessage: ClientMessage, decoder: (msg: ClientMessage) => T): T[] {
        const result: T[] = [];
        // begin frame
        clientMessage.nextFrame();
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(clientMessage)) {
            result.push(CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : decoder(clientMessage));
        }
        // end frame
        clientMessage.nextFrame();
        return result;
    }
}
