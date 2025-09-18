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
exports.ListMultiFrameCodec = void 0;
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("./CodecUtil");
/** @internal */
class ListMultiFrameCodec {
    static encode(clientMessage, list, encoder) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        for (let i = 0, n = list.length; i < n; i++) {
            encoder(clientMessage, list[i]);
        }
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static encodeContainsNullable(clientMessage, list, encoder) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        for (let i = 0, n = list.length; i < n; i++) {
            const item = list[i];
            if (item === null) {
                clientMessage.addFrame(ClientMessage_1.NULL_FRAME.copy());
            }
            else {
                encoder(clientMessage, list[i]);
            }
        }
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static encodeNullable(clientMessage, list, encoder) {
        if (list === null) {
            clientMessage.addFrame(ClientMessage_1.NULL_FRAME.copy());
        }
        else {
            this.encode(clientMessage, list, encoder);
        }
    }
    static decode(clientMessage, decoder) {
        const result = [];
        // begin frame
        clientMessage.nextFrame();
        while (!CodecUtil_1.CodecUtil.nextFrameIsDataStructureEndFrame(clientMessage)) {
            result.push(decoder(clientMessage));
        }
        // end frame
        clientMessage.nextFrame();
        return result;
    }
    static decodeNullable(clientMessage, decoder) {
        return CodecUtil_1.CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : ListMultiFrameCodec.decode(clientMessage, decoder);
    }
    static decodeContainsNullable(clientMessage, decoder) {
        const result = [];
        // begin frame
        clientMessage.nextFrame();
        while (!CodecUtil_1.CodecUtil.nextFrameIsDataStructureEndFrame(clientMessage)) {
            result.push(CodecUtil_1.CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : decoder(clientMessage));
        }
        // end frame
        clientMessage.nextFrame();
        return result;
    }
}
exports.ListMultiFrameCodec = ListMultiFrameCodec;
//# sourceMappingURL=ListMultiFrameCodec.js.map