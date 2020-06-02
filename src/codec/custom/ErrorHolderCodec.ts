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
import {Buffer} from 'safe-buffer';
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, ForwardFrameIterator, Frame} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {StringCodec} from '../builtin/StringCodec';
import {StackTraceElement} from '../../protocol/StackTraceElement';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {StackTraceElementCodec} from './StackTraceElementCodec';
import {ErrorHolder} from '../../protocol/ErrorHolder';

const ERROR_CODE_OFFSET = 0;
const INITIAL_FRAME_SIZE = ERROR_CODE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export class ErrorHolderCodec {
    static encode(clientMessage: ClientMessage, errorHolder: ErrorHolder): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = new Frame(Buffer.allocUnsafe(INITIAL_FRAME_SIZE));
        FixSizedTypesCodec.encodeInt(initialFrame.content, ERROR_CODE_OFFSET, errorHolder.errorCode);
        clientMessage.addFrame(initialFrame);

        StringCodec.encode(clientMessage, errorHolder.className);
        CodecUtil.encodeNullable(clientMessage, errorHolder.message, StringCodec.encode);
        ListMultiFrameCodec.encode(clientMessage, errorHolder.stackTraceElements, StackTraceElementCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(iterator: ForwardFrameIterator): ErrorHolder {
        // begin frame
        iterator.getNextFrame();

        const initialFrame = iterator.getNextFrame();
        const errorCode: number = FixSizedTypesCodec.decodeInt(initialFrame.content, ERROR_CODE_OFFSET);
        const className: string = StringCodec.decode(iterator);
        const message: string = CodecUtil.decodeNullable(iterator, StringCodec.decode);
        const stackTraceElements: StackTraceElement[] = ListMultiFrameCodec.decode(iterator, StackTraceElementCodec.decode);

        CodecUtil.fastForwardToEndFrame(iterator);

        return new ErrorHolder(errorCode, className, message, stackTraceElements);
    }
}
