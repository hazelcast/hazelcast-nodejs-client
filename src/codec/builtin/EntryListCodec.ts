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

import {BEGIN_FRAME, ClientMessage, END_FRAME, ForwardFrameIterator, NULL_FRAME} from '../../ClientMessage';
import {CodecUtil} from './CodecUtil';

export class EntryListCodec {
    static encode<K, V>(clientMessage: ClientMessage, entries: Array<[K, V]>,
                        keyEncoder: (msg: ClientMessage, key: K) => void,
                        valueEncoder: (msg: ClientMessage, value: V) => void): void {
        clientMessage.add(BEGIN_FRAME.copy());
        for (let i = 0, n = entries.length; i < n; i++) {
            keyEncoder(clientMessage, entries[i][0]);
            valueEncoder(clientMessage, entries[i][1]);
        }
        clientMessage.add(END_FRAME.copy());
    }

    static encodeNullable<K, V>(clientMessage: ClientMessage, entries: Array<[K, V]>,
                                keyEncoder: (msg: ClientMessage, key: K) => void,
                                valueEncoder: (msg: ClientMessage, value: V) => void): void {
        if (entries === null) {
            clientMessage.add(NULL_FRAME.copy());
        } else {
            this.encode(clientMessage, entries, keyEncoder, valueEncoder);
        }
    }

    static decode<K, V>(iterator: ForwardFrameIterator,
                        keyDecoder: (it: ForwardFrameIterator) => K,
                        valueDecoder: (it: ForwardFrameIterator) => V): Array<[K, V]> {
        const result: Array<[K, V]> = [];
        // begin frame
        iterator.getNextFrame();
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(iterator)) {
            const key = keyDecoder(iterator);
            const value = valueDecoder(iterator);
            result.push([key, value]);
        }
        // end frame
        iterator.getNextFrame();
        return result;
    }

    static decodeNullable<K, V>(iterator: ForwardFrameIterator,
                                keyDecoder: (it: ForwardFrameIterator) => K,
                                valueDecoder: (it: ForwardFrameIterator) => V): Array<[K, V]> {
        return CodecUtil.nextFrameIsNullEndFrame(iterator) ? null : this.decode(iterator, keyDecoder, valueDecoder);
    }
}
