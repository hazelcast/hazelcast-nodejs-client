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

const LINE_NUMBER_OFFSET = 0;
const INITIAL_FRAME_SIZE = LINE_NUMBER_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export class StackTraceElementCodec {
    static encode(clientMessage: ClientMessage, stackTraceElement: StackTraceElement): void {
        clientMessage.add(BEGIN_FRAME.copy());

        const initialFrame = new Frame(Buffer.allocUnsafe(INITIAL_FRAME_SIZE));
        FixSizedTypesCodec.encodeInt(initialFrame.content, LINE_NUMBER_OFFSET, stackTraceElement.lineNumber);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, stackTraceElement.className);
        StringCodec.encode(clientMessage, stackTraceElement.methodName);
        CodecUtil.encodeNullable(clientMessage, stackTraceElement.fileName, StringCodec.encode);

        clientMessage.add(END_FRAME.copy());
    }

    static decode(iterator: ForwardFrameIterator): StackTraceElement {
        // begin frame
        iterator.getNextFrame();

        const initialFrame = iterator.getNextFrame();
        const lineNumber: number = FixSizedTypesCodec.decodeInt(initialFrame.content, LINE_NUMBER_OFFSET);
        const className: string = StringCodec.decode(iterator);
        const methodName: string = StringCodec.decode(iterator);
        const fileName: string = CodecUtil.decodeNullable(iterator, StringCodec.decode);

        CodecUtil.fastForwardToEndFrame(iterator);

        return new StackTraceElement(className, methodName, fileName, lineNumber);
    }
}
