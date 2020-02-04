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

import {BEGIN_FRAME, ClientMessage, END_FRAME, ForwardFrameIterator} from '../../ClientMessage';
import * as Long from 'long';
import {Buffer} from 'safe-buffer';
import {ByteArrayCodec} from './ByteArrayCodec';
import {ListLongCodec} from './ListLongCodec';
import {ListMultiFrameCodec} from './ListMultiFrameCodec';

export class EntryListLongByteArrayCodec {
    static encode(clientMessage: ClientMessage, entries: Array<[Long, Buffer]>): void {
        const entryCount = entries.length;
        const keys = new Array<Long>(entryCount);
        clientMessage.add(BEGIN_FRAME.copy());
        for (let i = 0; i < entryCount; i++) {
            keys[i] = entries[i][0];
            ByteArrayCodec.encode(clientMessage, entries[i][1]);
        }
        clientMessage.add(END_FRAME.copy());
        ListLongCodec.encode(clientMessage, keys);
    }

    static decode(iterator: ForwardFrameIterator): Array<[Long, Buffer]> {
        const values = ListMultiFrameCodec.decode(iterator, ByteArrayCodec.decode);
        const keys = ListLongCodec.decode(iterator);

        const result = new Array<[Long, Buffer]>(keys.length);
        for (let i = 0; i < result.length; i++) {
            result[i] = [keys[i], values[i]];
        }
        return result;
    }
}
