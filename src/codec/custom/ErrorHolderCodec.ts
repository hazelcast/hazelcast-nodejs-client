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
import {ErrorHolder} from '../../protocol/ErrorHolder';
import {StringCodec} from '../builtin/StringCodec';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {StackTraceElementCodec} from './StackTraceElementCodec';

const ERROR_CODE_OFFSET = 0;
const INITIAL_FRAME_SIZE = ERROR_CODE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class ErrorHolderCodec {
    static encode(clientMessage: ClientMessage, errorHolder: ErrorHolder): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeInt(initialFrame.content, ERROR_CODE_OFFSET, errorHolder.errorCode);
        clientMessage.addFrame(initialFrame);

        StringCodec.encode(clientMessage, errorHolder.className);
        CodecUtil.encodeNullable(clientMessage, errorHolder.message, StringCodec.encode);
        ListMultiFrameCodec.encode(clientMessage, errorHolder.stackTraceElements, StackTraceElementCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): ErrorHolder {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const errorCode = FixSizedTypesCodec.decodeInt(initialFrame.content, ERROR_CODE_OFFSET);

        const className = StringCodec.decode(clientMessage);
        const message = CodecUtil.decodeNullable(clientMessage, StringCodec.decode);
        const stackTraceElements = ListMultiFrameCodec.decode(clientMessage, StackTraceElementCodec.decode);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new ErrorHolder(errorCode, className, message, stackTraceElements);
    }
}
