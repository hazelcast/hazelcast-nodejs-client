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

import {ClientMessage, ForwardFrameIterator, Frame} from '../../ClientMessage';
import * as Long from 'long';
import {BitsUtil} from '../../BitsUtil';
import {Buffer} from 'safe-buffer';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

export class LongArrayCodec {
    static encode(clientMessage: ClientMessage, array: Long[]): void {
        const itemCount = array.length;
        const frame = new Frame(Buffer.allocUnsafe(itemCount * BitsUtil.LONG_SIZE_IN_BYTES));
        for (let i = 0; i < itemCount; i++) {
            FixSizedTypesCodec.encodeLong(frame.content, i * BitsUtil.LONG_SIZE_IN_BYTES, array[i]);
        }
        clientMessage.add(frame);
    }

    static decode(iterator: ForwardFrameIterator): Long[] {
        const frame = iterator.next();
        const itemCount = frame.content.length / BitsUtil.LONG_SIZE_IN_BYTES;
        const result = new Array<Long>(itemCount);
        for (let i = 0; i < itemCount; i++) {
            result[i] = FixSizedTypesCodec.decodeLong(frame.content, i * BitsUtil.LONG_SIZE_IN_BYTES);
        }
        return result;
    }
}
