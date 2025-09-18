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
exports.EntryListCodec = void 0;
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("./CodecUtil");
/** @internal */
class EntryListCodec {
    static encode(clientMessage, entries, keyEncoder, valueEncoder) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        for (let i = 0, n = entries.length; i < n; i++) {
            keyEncoder(clientMessage, entries[i][0]);
            valueEncoder(clientMessage, entries[i][1]);
        }
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static encodeNullable(clientMessage, entries, keyEncoder, valueEncoder) {
        if (entries === null) {
            clientMessage.addFrame(ClientMessage_1.NULL_FRAME.copy());
        }
        else {
            this.encode(clientMessage, entries, keyEncoder, valueEncoder);
        }
    }
    static decode(clientMessage, keyDecoder, valueDecoder) {
        const result = [];
        // begin frame
        clientMessage.nextFrame();
        while (!CodecUtil_1.CodecUtil.nextFrameIsDataStructureEndFrame(clientMessage)) {
            const key = keyDecoder(clientMessage);
            const value = valueDecoder(clientMessage);
            result.push([key, value]);
        }
        // end frame
        clientMessage.nextFrame();
        return result;
    }
    static decodeNullable(clientMessage, keyDecoder, valueDecoder) {
        return CodecUtil_1.CodecUtil.nextFrameIsNullFrame(clientMessage) ?
            null : EntryListCodec.decode(clientMessage, keyDecoder, valueDecoder);
    }
}
exports.EntryListCodec = EntryListCodec;
//# sourceMappingURL=EntryListCodec.js.map