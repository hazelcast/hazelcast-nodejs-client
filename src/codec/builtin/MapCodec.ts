/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

export class MapCodec {
    static encode<K, V>(clientMessage: ClientMessage, map: Map<K, V>,
                        keyEncoder: (msg: ClientMessage, key: K) => void,
                        valueEncoder: (msg: ClientMessage, value: V) => void): void {
        clientMessage.add(BEGIN_FRAME.copy());
        map.forEach((value, key) => {
            keyEncoder(clientMessage, key);
            valueEncoder(clientMessage, value);
        });
        clientMessage.add(END_FRAME.copy());
    }

    static encodeNullable<K, V>(clientMessage: ClientMessage, map: Map<K, V>,
                                keyEncoder: (msg: ClientMessage, key: K) => void,
                                valueEncoder: (msg: ClientMessage, value: V) => void): void {
        if (map === null) {
            clientMessage.add(NULL_FRAME.copy());
        } else {
            this.encode(clientMessage, map, keyEncoder, valueEncoder);
        }
    }

    static decode<K, V>(iterator: ForwardFrameIterator,
                        keyDecoder: (it: ForwardFrameIterator) => K,
                        valueDecoder: (it: ForwardFrameIterator) => V): Map<K, V> {
        const result = new Map<K, V>();
        // begin frame
        iterator.next();
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(iterator)) {
            const key = keyDecoder(iterator);
            const value = valueDecoder(iterator);
            result.set(key, value);
        }
        // end frame
        iterator.next();
        return result;
    }

    static decodeNullable<K, V>(iterator: ForwardFrameIterator,
                                keyDecoder: (it: ForwardFrameIterator) => K,
                                valueDecoder: (it: ForwardFrameIterator) => V): Map<K, V> {
        return CodecUtil.nextFrameIsNullEndFrame(iterator) ? null : this.decode(iterator, keyDecoder, valueDecoder);
    }
}
