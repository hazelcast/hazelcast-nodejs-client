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

import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, Frame} from '../../ClientMessage';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

const ENTRY_SIZE_IN_BYTES = BitsUtil.INT_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES;

export class EntryListIntegerIntegerCodec {
    static encode(clientMessage: ClientMessage, entries: Array<[number, number]>): void {
        const entryCount = entries.length;
        const frame = new Frame(Buffer.allocUnsafe(entryCount * ENTRY_SIZE_IN_BYTES));
        for (let i = 0; i < entryCount; i++) {
            FixSizedTypesCodec.encodeInt(frame.content, i * ENTRY_SIZE_IN_BYTES, entries[i][0]);
            FixSizedTypesCodec.encodeInt(frame.content, i * ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES, entries[i][1]);
        }
        clientMessage.addFrame(frame);
    }

    static decode(clientMessage: ClientMessage): Array<[number, number]> {
        const frame = clientMessage.nextFrame();
        const entryCount = frame.content.length / ENTRY_SIZE_IN_BYTES;
        const result = new Array<[number, number]>(entryCount);
        for (let i = 0; i < entryCount; i++) {
            const key = FixSizedTypesCodec.decodeInt(frame.content, i * ENTRY_SIZE_IN_BYTES);
            const value = FixSizedTypesCodec.decodeInt(frame.content, i * ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES);
            result[i] = [key, value];
        }
        return result;
    }
}
