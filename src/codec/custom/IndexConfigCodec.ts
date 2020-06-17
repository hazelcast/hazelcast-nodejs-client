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

/*tslint:disable:max-line-length*/
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, Frame, DEFAULT_FLAGS} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {StringCodec} from '../builtin/StringCodec';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {BitmapIndexOptions} from '../../config/BitmapIndexOptions';
import {BitmapIndexOptionsCodec} from './BitmapIndexOptionsCodec';
import {IndexConfig} from '../../config/IndexConfig';

const TYPE_OFFSET = 0;
const INITIAL_FRAME_SIZE = TYPE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export class IndexConfigCodec {
    static encode(clientMessage: ClientMessage, indexConfig: IndexConfig): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeInt(initialFrame.content, TYPE_OFFSET, indexConfig.type);
        clientMessage.addFrame(initialFrame);

        CodecUtil.encodeNullable(clientMessage, indexConfig.name, StringCodec.encode);
        ListMultiFrameCodec.encode(clientMessage, indexConfig.attributes, StringCodec.encode);
        CodecUtil.encodeNullable(clientMessage, indexConfig.bitmapIndexOptions, BitmapIndexOptionsCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): IndexConfig {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const type: number = FixSizedTypesCodec.decodeInt(initialFrame.content, TYPE_OFFSET);
        const name: string = CodecUtil.decodeNullable(clientMessage, StringCodec.decode);
        const attributes: string[] = ListMultiFrameCodec.decode(clientMessage, StringCodec.decode);
        const bitmapIndexOptions: BitmapIndexOptions = CodecUtil.decodeNullable(clientMessage, BitmapIndexOptionsCodec.decode);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new IndexConfig(name, type, attributes, bitmapIndexOptions);
    }
}
