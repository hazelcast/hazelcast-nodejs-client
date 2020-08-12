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

import {BEGIN_FRAME, ClientMessage, END_FRAME, NULL_FRAME} from '../../protocol/ClientMessage';
import {CodecUtil} from './CodecUtil';

/** @internal */
export class EntryListCodec {
    static encode<K, V>(clientMessage: ClientMessage, entries: Array<[K, V]>,
                        keyEncoder: (msg: ClientMessage, key: K) => void,
                        valueEncoder: (msg: ClientMessage, value: V) => void): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());
        for (let i = 0, n = entries.length; i < n; i++) {
            keyEncoder(clientMessage, entries[i][0]);
            valueEncoder(clientMessage, entries[i][1]);
        }
        clientMessage.addFrame(END_FRAME.copy());
    }

    static encodeNullable<K, V>(clientMessage: ClientMessage, entries: Array<[K, V]>,
                                keyEncoder: (msg: ClientMessage, key: K) => void,
                                valueEncoder: (msg: ClientMessage, value: V) => void): void {
        if (entries === null) {
            clientMessage.addFrame(NULL_FRAME.copy());
        } else {
            this.encode(clientMessage, entries, keyEncoder, valueEncoder);
        }
    }

    static decode<K, V>(clientMessage: ClientMessage,
                        keyDecoder: (msg: ClientMessage) => K,
                        valueDecoder: (msg: ClientMessage) => V): Array<[K, V]> {
        const result: Array<[K, V]> = [];
        // begin frame
        clientMessage.nextFrame();
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(clientMessage)) {
            const key = keyDecoder(clientMessage);
            const value = valueDecoder(clientMessage);
            result.push([key, value]);
        }
        // end frame
        clientMessage.nextFrame();
        return result;
    }

    static decodeNullable<K, V>(clientMessage: ClientMessage,
                                keyDecoder: (msg: ClientMessage) => K,
                                valueDecoder: (msg: ClientMessage) => V): Array<[K, V]> {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : this.decode(clientMessage, keyDecoder, valueDecoder);
    }
}
