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

import {ClientMessage, Frame} from '../ClientMessage';
import {CodecUtil} from './CodecUtil';

export class MapCodec {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode<K, V>(clientMessage: ClientMessage, collection: Array<[K, V]>,
                               encodeKeyFunc: (clientMessage: ClientMessage, K: K) => void,
                               encodeValueFunc: (clientMessage: ClientMessage, V: V) => void): void {

        clientMessage.add(ClientMessage.BEGIN_FRAME);
        collection.forEach((entry) => {
            encodeKeyFunc(clientMessage, entry[0]);
        });

        clientMessage.add(ClientMessage.END_FRAME);

        clientMessage.add(ClientMessage.BEGIN_FRAME);
        collection.forEach((entry) => {
            encodeValueFunc(clientMessage, entry[1]);
        });
        clientMessage.add(ClientMessage.END_FRAME);
    }

    public static encodeNullable<K, V>(clientMessage: ClientMessage, collection: Array<[K, V]>,
                                       encodeKeyFunc: (clientMessage: ClientMessage, K: K) => void,
                                       encodeValueFunc: (clientMessage: ClientMessage, V: V) => void): void {

        if (collection == null) {
            clientMessage.add(ClientMessage.NULL_FRAME);
        } else {
            MapCodec.encode(clientMessage, collection, encodeKeyFunc, encodeValueFunc);
        }

    }

    public static encodeMap<K, V>(clientMessage: ClientMessage, collection: Array<[K, V]>,
                                  encodeKeyFunc: (clientMessage: ClientMessage, K: K) => void,
                                  encodeValueFunc: (clientMessage: ClientMessage, V: V) => void): void {

        MapCodec.encode(clientMessage, collection, encodeKeyFunc, encodeValueFunc); //map.entrySet()

    }

    public static decode<K, V>(frame: Frame, decodeKeyFunc: (frame: Frame) => K,
                               decodeValueFunc: (frame: Frame) => V): Array<[K, V]> {

        const result: Array<[K, V]> = [];
        frame = frame.next;
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(frame)) {
            const key: K = decodeKeyFunc.apply(frame);
            const value: V = decodeValueFunc.apply(frame);
            result.push([key, value]);
        }
        frame = frame.next;
        return result;
    }

    public static decodeNullable<K, V>(frame: Frame, decodeKeyFunc: (frame: Frame) => K,
                                       decodeValueFunc: (frame: Frame) => V): Array<[K, V]> {

        return CodecUtil.nextFrameIsNullEndFrame(frame) ? null : MapCodec.decode(frame, decodeKeyFunc, decodeValueFunc);

    }

    public static decodeToMap<K, V>(frame: Frame, decodeKeyFunc: (frame: Frame) => K,
                                    decodeValueFunc: (frame: Frame) => V): Array<[K, V]> {

        const result: Array<[K, V]> = [];
        frame = frame.next;
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(frame)) {
            const key: K = decodeKeyFunc.apply(frame);
            const value: V = decodeValueFunc.apply(frame);
            result.push([key, value]);
        }
        frame = frame.next;
        return result;
    }

    public static decodeToNullable<K, V>(frame: Frame, decodeKeyFunc: (frame: Frame) => K,
                                         decodeValueFunc: (frame: Frame) => V): Array<[K, V]> {

        return CodecUtil.nextFrameIsNullEndFrame(frame) ? null : MapCodec.decodeToMap(frame, decodeKeyFunc, decodeValueFunc);

    }

}
