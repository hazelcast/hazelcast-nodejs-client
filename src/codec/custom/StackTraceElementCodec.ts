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
import {BitsUtil} from '../../util/BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, Frame, DEFAULT_FLAGS} from '../../protocol/ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {StackTraceElement} from '../../protocol/StackTraceElement';
import {StringCodec} from '../builtin/StringCodec';

const LINE_NUMBER_OFFSET = 0;
const INITIAL_FRAME_SIZE = LINE_NUMBER_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class StackTraceElementCodec {
    static encode(clientMessage: ClientMessage, stackTraceElement: StackTraceElement): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeInt(initialFrame.content, LINE_NUMBER_OFFSET, stackTraceElement.lineNumber);
        clientMessage.addFrame(initialFrame);

        StringCodec.encode(clientMessage, stackTraceElement.className);
        StringCodec.encode(clientMessage, stackTraceElement.methodName);
        CodecUtil.encodeNullable(clientMessage, stackTraceElement.fileName, StringCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): StackTraceElement {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const lineNumber = FixSizedTypesCodec.decodeInt(initialFrame.content, LINE_NUMBER_OFFSET);

        const className = StringCodec.decode(clientMessage);
        const methodName = StringCodec.decode(clientMessage);
        const fileName = CodecUtil.decodeNullable(clientMessage, StringCodec.decode);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new StackTraceElement(className, methodName, fileName, lineNumber);
    }
}
