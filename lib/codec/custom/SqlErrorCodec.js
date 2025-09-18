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
exports.SqlErrorCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const SqlError_1 = require("../../sql/SqlError");
const StringCodec_1 = require("../builtin/StringCodec");
const CODE_OFFSET = 0;
const ORIGINATING_MEMBER_ID_OFFSET = CODE_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = ORIGINATING_MEMBER_ID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
/** @internal */
class SqlErrorCodec {
    static encode(clientMessage, sqlError) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, CODE_OFFSET, sqlError.code);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeUUID(initialFrame.content, ORIGINATING_MEMBER_ID_OFFSET, sqlError.originatingMemberId);
        clientMessage.addFrame(initialFrame);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, sqlError.message, StringCodec_1.StringCodec.encode);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, sqlError.suggestion, StringCodec_1.StringCodec.encode);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const code = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, CODE_OFFSET);
        const originatingMemberId = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, ORIGINATING_MEMBER_ID_OFFSET);
        const message = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, StringCodec_1.StringCodec.decode);
        let isSuggestionExists = false;
        let suggestion = null;
        if (!clientMessage.peekNextFrame().isEndFrame()) {
            suggestion = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, StringCodec_1.StringCodec.decode);
            isSuggestionExists = true;
        }
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new SqlError_1.SqlError(code, message, originatingMemberId, isSuggestionExists, suggestion);
    }
}
exports.SqlErrorCodec = SqlErrorCodec;
//# sourceMappingURL=SqlErrorCodec.js.map