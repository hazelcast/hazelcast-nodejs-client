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

import {ClientMessage, ForwardFrameIterator, Frame, NULL_FRAME} from '../../ClientMessage';
import {Data} from '../../serialization/Data';
import {HeapData} from '../../serialization/HeapData';
import {CodecUtil} from './CodecUtil';

export class DataCodec {
    static encode(clientMessage: ClientMessage, data: Data): void {
        clientMessage.add(new Frame(data.toBuffer()));
    }

    static encodeNullable(clientMessage: ClientMessage, data: Data): void {
        if (data === null) {
            clientMessage.add(NULL_FRAME.copy());
        } else {
            clientMessage.add(new Frame(data.toBuffer()));
        }
    }

    static decode(iterator: ForwardFrameIterator): Data {
        return new HeapData(iterator.getNextFrame().content);
    }

    static decodeNullable(iterator: ForwardFrameIterator): Data {
        return CodecUtil.nextFrameIsNullEndFrame(iterator) ? null : this.decode(iterator);
    }
}
