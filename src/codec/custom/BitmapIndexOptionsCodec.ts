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
import {ClientMessage, BEGIN_FRAME, END_FRAME, Frame} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {StringCodec} from '../builtin/StringCodec';
import {BitmapIndexOptions} from '../../config/BitmapIndexOptions';

const UNIQUE_KEY_TRANSFORMATION_OFFSET = 0;
const INITIAL_FRAME_SIZE = UNIQUE_KEY_TRANSFORMATION_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export class BitmapIndexOptionsCodec {
    static encode(clientMessage: ClientMessage, bitmapIndexOptions: BitmapIndexOptions): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, undefined);
        FixSizedTypesCodec.encodeInt(initialFrame.content, UNIQUE_KEY_TRANSFORMATION_OFFSET, bitmapIndexOptions.uniqueKeyTransformation);
        clientMessage.addFrame(initialFrame);

        StringCodec.encode(clientMessage, bitmapIndexOptions.uniqueKey);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): BitmapIndexOptions {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const uniqueKeyTransformation: number = FixSizedTypesCodec.decodeInt(initialFrame.content, UNIQUE_KEY_TRANSFORMATION_OFFSET);
        const uniqueKey: string = StringCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new BitmapIndexOptions(uniqueKey, uniqueKeyTransformation);
    }
}
