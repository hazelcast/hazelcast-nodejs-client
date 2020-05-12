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

import {ClientMessage, ForwardFrameIterator, Frame} from '../../ClientMessage';
import {UUID} from '../../core/UUID';
import {BitsUtil} from '../../BitsUtil';
import {Buffer} from 'safe-buffer';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

export class ListUUIDCodec {
    static encode(clientMessage: ClientMessage, list: UUID[]): void {
        const itemCount = list.length;
        const frame = new Frame(Buffer.allocUnsafe(itemCount * BitsUtil.UUID_SIZE_IN_BYTES));
        for (let i = 0; i < itemCount; i++) {
            FixSizedTypesCodec.encodeUUID(frame.content, i * BitsUtil.UUID_SIZE_IN_BYTES, list[i]);
        }
        clientMessage.add(frame);
    }

    static decode(iterator: ForwardFrameIterator): UUID[] {
        const frame = iterator.next();
        const itemCount = frame.content.length / BitsUtil.UUID_SIZE_IN_BYTES;
        const result = new Array<UUID>(itemCount);
        for (let i = 0; i < itemCount; i++) {
            result[i] = FixSizedTypesCodec.decodeUUID(frame.content, i * BitsUtil.UUID_SIZE_IN_BYTES);
        }
        return result;
    }
}
