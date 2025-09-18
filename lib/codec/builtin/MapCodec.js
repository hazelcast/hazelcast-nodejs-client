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
exports.MapCodec = void 0;
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("./CodecUtil");
/** @internal */
class MapCodec {
    static encode(clientMessage, map, keyEncoder, valueEncoder) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        map.forEach((value, key) => {
            keyEncoder(clientMessage, key);
            valueEncoder(clientMessage, value);
        });
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static encodeNullable(clientMessage, map, keyEncoder, valueEncoder) {
        if (map === null) {
            clientMessage.addFrame(ClientMessage_1.NULL_FRAME.copy());
        }
        else {
            this.encode(clientMessage, map, keyEncoder, valueEncoder);
        }
    }
    static decode(clientMessage, keyDecoder, valueDecoder) {
        const result = new Map();
        // begin frame
        clientMessage.nextFrame();
        while (!CodecUtil_1.CodecUtil.nextFrameIsDataStructureEndFrame(clientMessage)) {
            const key = keyDecoder(clientMessage);
            const value = valueDecoder(clientMessage);
            result.set(key, value);
        }
        // end frame
        clientMessage.nextFrame();
        return result;
    }
    static decodeNullable(clientMessage, keyDecoder, valueDecoder) {
        return CodecUtil_1.CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : MapCodec.decode(clientMessage, keyDecoder, valueDecoder);
    }
}
exports.MapCodec = MapCodec;
//# sourceMappingURL=MapCodec.js.map