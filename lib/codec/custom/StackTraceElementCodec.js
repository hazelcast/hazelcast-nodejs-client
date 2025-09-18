"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackTraceElementCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const StackTraceElement_1 = require("../../protocol/StackTraceElement");
const StringCodec_1 = require("../builtin/StringCodec");
const LINE_NUMBER_OFFSET = 0;
const INITIAL_FRAME_SIZE = LINE_NUMBER_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
/** @internal */
class StackTraceElementCodec {
    static encode(clientMessage, stackTraceElement) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, LINE_NUMBER_OFFSET, stackTraceElement.lineNumber);
        clientMessage.addFrame(initialFrame);
        StringCodec_1.StringCodec.encode(clientMessage, stackTraceElement.className);
        StringCodec_1.StringCodec.encode(clientMessage, stackTraceElement.methodName);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, stackTraceElement.fileName, StringCodec_1.StringCodec.encode);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const lineNumber = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, LINE_NUMBER_OFFSET);
        const className = StringCodec_1.StringCodec.decode(clientMessage);
        const methodName = StringCodec_1.StringCodec.decode(clientMessage);
        const fileName = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, StringCodec_1.StringCodec.decode);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new StackTraceElement_1.StackTraceElement(className, methodName, fileName, lineNumber);
    }
}
exports.StackTraceElementCodec = StackTraceElementCodec;
//# sourceMappingURL=StackTraceElementCodec.js.map