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

/* eslint-disable max-len */
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, Frame, DEFAULT_FLAGS} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {StringCodec} from '../builtin/StringCodec';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {BitmapIndexOptionsCodec} from './BitmapIndexOptionsCodec';
import {IndexConfigImpl} from '../../config/IndexConfig';
import {indexTypeToId, indexTypeFromId} from '../../config/IndexType';

const TYPE_OFFSET = 0;
const INITIAL_FRAME_SIZE = TYPE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export class IndexConfigCodec {
    static encode(clientMessage: ClientMessage, indexConfig: IndexConfigImpl): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        const typeId = indexTypeToId(indexConfig.type);
        FixSizedTypesCodec.encodeInt(initialFrame.content, TYPE_OFFSET, typeId);
        clientMessage.addFrame(initialFrame);

        CodecUtil.encodeNullable(clientMessage, indexConfig.name, StringCodec.encode);
        ListMultiFrameCodec.encode(clientMessage, indexConfig.attributes, StringCodec.encode);
        CodecUtil.encodeNullable(clientMessage, indexConfig.bitmapIndexOptions, BitmapIndexOptionsCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): IndexConfigImpl {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const typeId: number = FixSizedTypesCodec.decodeInt(initialFrame.content, TYPE_OFFSET);
        const name = CodecUtil.decodeNullable(clientMessage, StringCodec.decode);
        const attributes = ListMultiFrameCodec.decode(clientMessage, StringCodec.decode);
        const bitmapIndexOptions = CodecUtil.decodeNullable(clientMessage, BitmapIndexOptionsCodec.decode);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        const type = indexTypeFromId(typeId);
        return new IndexConfigImpl(name, type, attributes, bitmapIndexOptions);
    }
}
