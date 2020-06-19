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

import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, Frame} from '../../ClientMessage';
import {UUID} from '../../core/UUID';
import * as Long from 'long';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

const ENTRY_SIZE_IN_BYTES = BitsUtil.UUID_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES;

export class EntryListUUIDLongCodec {
    static encode(clientMessage: ClientMessage, entries: Array<[UUID, Long]>): void {
        const entryCount = entries.length;
        const frame = new Frame(Buffer.allocUnsafe(entryCount * ENTRY_SIZE_IN_BYTES));
        for (let i = 0; i < entryCount; i++) {
            FixSizedTypesCodec.encodeUUID(frame.content, i * ENTRY_SIZE_IN_BYTES, entries[i][0]);
            FixSizedTypesCodec.encodeLong(frame.content, i * ENTRY_SIZE_IN_BYTES + BitsUtil.UUID_SIZE_IN_BYTES, entries[i][1]);
        }
        clientMessage.addFrame(frame);
    }

    static decode(clientMessage: ClientMessage): Array<[UUID, Long]> {
        const frame = clientMessage.nextFrame();
        const entryCount = frame.content.length / ENTRY_SIZE_IN_BYTES;
        const result = new Array<[UUID, Long]>(entryCount);
        for (let i = 0; i < entryCount; i++) {
            const key = FixSizedTypesCodec.decodeUUID(frame.content, i * ENTRY_SIZE_IN_BYTES);
            const value = FixSizedTypesCodec.decodeLong(frame.content, i * ENTRY_SIZE_IN_BYTES + BitsUtil.UUID_SIZE_IN_BYTES);
            result[i] = [key, value];
        }
        return result;
    }
}
