/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import {ClientMessage, Frame} from '../ClientMessage';
import {BitsUtil} from "../BitsUtil";
import {Buffer} from 'safe-buffer';
import {FixedSizeTypes} from "./FixedSizeTypes";
import {CodecUtil} from "./CodecUtil";
import {StringCodec} from "./StringCodec";
import {StackTraceElement} from "../StackTraceElement";
import {DataCodec} from "./DataCodec";


export class StackTraceElementCodec {
    private static LINE_NUMBER : number = 0;
    private static INITIAL_FRAME_SIZE : number = StackTraceElementCodec.LINE_NUMBER + BitsUtil.INT_SIZE_IN_BYTES;

    constructor() {
    }

    static encode(clientMessage: ClientMessage, stackTraceElement : StackTraceElement) {
        clientMessage.add(ClientMessage.BEGIN_FRAME);

        var initialFrame: Frame = new Frame(Buffer.allocUnsafe(StackTraceElementCodec.INITIAL_FRAME_SIZE));
        FixedSizeTypes.encodeInt(initialFrame.content, StackTraceElementCodec.LINE_NUMBER, stackTraceElement.lineNumber);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, stackTraceElement.declaringClass);
        StringCodec.encode(clientMessage, stackTraceElement.methodName);
        CodecUtil.encodeNullable(clientMessage, stackTraceElement.fileName, StringCodec.encode);

        clientMessage.add(ClientMessage.END_FRAME);

    }

    static decode(frame: Frame): StackTraceElement {
        frame = frame.next;
        var initialFrame : Frame = frame.next;
        var lineNumber : number = FixedSizeTypes.decodeInt(initialFrame.content, StackTraceElementCodec.LINE_NUMBER);

        var declaringClass : string = StringCodec.decode(frame);
        var methodName : string = StringCodec.decode(frame);
        var fileName : string = CodecUtil.decodeNullable(frame, StringCodec.decode);

        CodecUtil.fastForwardToEndFrame(frame);
        return new StackTraceElement(declaringClass, methodName, fileName, lineNumber);
    }
}
