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
exports.BitmapIndexOptionsCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const BitmapIndexOptions_1 = require("../../config/BitmapIndexOptions");
const StringCodec_1 = require("../builtin/StringCodec");
const UNIQUE_KEY_TRANSFORMATION_OFFSET = 0;
const INITIAL_FRAME_SIZE = UNIQUE_KEY_TRANSFORMATION_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
/** @internal */
class BitmapIndexOptionsCodec {
    static encode(clientMessage, bitmapIndexOptions) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, UNIQUE_KEY_TRANSFORMATION_OFFSET, bitmapIndexOptions.uniqueKeyTransformation);
        clientMessage.addFrame(initialFrame);
        StringCodec_1.StringCodec.encode(clientMessage, bitmapIndexOptions.uniqueKey);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const uniqueKeyTransformation = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, UNIQUE_KEY_TRANSFORMATION_OFFSET);
        const uniqueKey = StringCodec_1.StringCodec.decode(clientMessage);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new BitmapIndexOptions_1.InternalBitmapIndexOptions(uniqueKey, uniqueKeyTransformation);
    }
}
exports.BitmapIndexOptionsCodec = BitmapIndexOptionsCodec;
//# sourceMappingURL=BitmapIndexOptionsCodec.js.map