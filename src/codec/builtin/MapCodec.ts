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
export class MapCodec {
    static encode<K, V>(clientMessage: ClientMessage, map: Map<K, V>,
                        keyEncoder: (msg: ClientMessage, key: K) => void,
                        valueEncoder: (msg: ClientMessage, value: V) => void): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());
        map.forEach((value, key) => {
            keyEncoder(clientMessage, key);
            valueEncoder(clientMessage, value);
        });
        clientMessage.addFrame(END_FRAME.copy());
    }

    static encodeNullable<K, V>(clientMessage: ClientMessage, map: Map<K, V>,
                                keyEncoder: (msg: ClientMessage, key: K) => void,
                                valueEncoder: (msg: ClientMessage, value: V) => void): void {
        if (map === null) {
            clientMessage.addFrame(NULL_FRAME.copy());
        } else {
            this.encode(clientMessage, map, keyEncoder, valueEncoder);
        }
    }

    static decode<K, V>(clientMessage: ClientMessage,
                        keyDecoder: (msg: ClientMessage) => K,
                        valueDecoder: (msg: ClientMessage) => V): Map<K, V> {
        const result = new Map<K, V>();
        // begin frame
        clientMessage.nextFrame();
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(clientMessage)) {
            const key = keyDecoder(clientMessage);
            const value = valueDecoder(clientMessage);
            result.set(key, value);
        }
        // end frame
        clientMessage.nextFrame();
        return result;
    }

    static decodeNullable<K, V>(clientMessage: ClientMessage,
                                keyDecoder: (msg: ClientMessage) => K,
                                valueDecoder: (msg: ClientMessage) => V): Map<K, V> {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : MapCodec.decode(clientMessage, keyDecoder, valueDecoder);
    }
}
