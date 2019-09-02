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
import {StackTraceElementCodec} from './StackTraceElementCodec';
import {BitsUtil} from "../BitsUtil";
import {Buffer} from 'safe-buffer';
import {StringCodec} from "./StringCodec";
import {FixedSizeTypes} from "./FixedSizeTypes";
import {CodecUtil} from "./CodecUtil";
import {ErrorHolder} from "../ErrorHolder";
import {StackTraceElement} from "../StackTraceElement";
import {ListMultiFrameCodec} from "./ListMultiFrameCodec";
import {DataCodec} from "./DataCodec";


export class ErrorCodec {


    public static EXCEPTION : number = 109;
    private static ERROR_CODE : number = 0;
    private static INITIAL_FRAME_SIZE : number = ErrorCodec.ERROR_CODE + BitsUtil.INT_SIZE_IN_BYTES;

    constructor() {
    }

    public static encode ( clientMessage: ClientMessage , errorHolder : ErrorHolder): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ErrorCodec.INITIAL_FRAME_SIZE));
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, errorHolder.getClassName());
        CodecUtil.encodeNullable(clientMessage,  errorHolder.getMessage(), StringCodec.encode);
        ListMultiFrameCodec.encode(clientMessage, errorHolder.getStackTraceElements(), StackTraceElementCodec.encode);

        clientMessage.add(ClientMessage.END_FRAME);
    }

    public static decode(frame: Frame) : ErrorHolder {
        //begin frame
        frame = frame.next;
        var initialFrame : Frame = frame.next;

        var errorCode : number = FixedSizeTypes.decodeInt(initialFrame.content, ErrorCodec.ERROR_CODE);

        var className : string = StringCodec.decode(frame);
        var message : string = CodecUtil.decodeNullable(frame, StringCodec.decode);
        var stackTraceElement : Array<StackTraceElement>  = ListMultiFrameCodec.decode(frame , StackTraceElementCodec.decode);

        CodecUtil.fastForwardToEndFrame(frame);
        return new ErrorHolder(errorCode, className, message, stackTraceElement);

    }

}
