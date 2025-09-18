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
exports.CodecUtil = void 0;
const ClientMessage_1 = require("../../protocol/ClientMessage");
/** @internal */
class CodecUtil {
    static fastForwardToEndFrame(clientMessage) {
        // We are starting from 1 because of the BEGIN_FRAME we read
        // in the beginning of the decode method
        let numberOfExpectedEndFrames = 1;
        let frame;
        while (numberOfExpectedEndFrames !== 0) {
            frame = clientMessage.nextFrame();
            if (frame.isEndFrame()) {
                numberOfExpectedEndFrames--;
            }
            else if (frame.isBeginFrame()) {
                numberOfExpectedEndFrames++;
            }
        }
    }
    static encodeNullable(clientMessage, value, encoder) {
        if (value == null) {
            clientMessage.addFrame(ClientMessage_1.NULL_FRAME.copy());
        }
        else {
            encoder(clientMessage, value);
        }
    }
    static decodeNullable(clientMessage, decoder) {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : decoder(clientMessage);
    }
    static nextFrameIsDataStructureEndFrame(clientMessage) {
        return clientMessage.peekNextFrame().isEndFrame();
    }
    /**
     * Returns whether the next frame is {@link NULL_FRAME} or not.
     * If it is a {@link NULL_FRAME}, this method consumes the iterator
     * by calling {@link ClientMessage.nextFrame} once to skip the {@link NULL_FRAME}.
     */
    static nextFrameIsNullFrame(clientMessage) {
        const isNull = clientMessage.peekNextFrame().isNullFrame();
        if (isNull) {
            clientMessage.nextFrame();
        }
        return isNull;
    }
}
exports.CodecUtil = CodecUtil;
//# sourceMappingURL=CodecUtil.js.map