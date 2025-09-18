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
exports.SqlQueryIdCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const SqlQueryId_1 = require("../../sql/SqlQueryId");
const MEMBER_ID_HIGH_OFFSET = 0;
const MEMBER_ID_LOW_OFFSET = MEMBER_ID_HIGH_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const LOCAL_ID_HIGH_OFFSET = MEMBER_ID_LOW_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const LOCAL_ID_LOW_OFFSET = LOCAL_ID_HIGH_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = LOCAL_ID_LOW_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class SqlQueryIdCodec {
    static encode(clientMessage, sqlQueryId) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, MEMBER_ID_HIGH_OFFSET, sqlQueryId.memberIdHigh);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, MEMBER_ID_LOW_OFFSET, sqlQueryId.memberIdLow);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, LOCAL_ID_HIGH_OFFSET, sqlQueryId.localIdHigh);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, LOCAL_ID_LOW_OFFSET, sqlQueryId.localIdLow);
        clientMessage.addFrame(initialFrame);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const memberIdHigh = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, MEMBER_ID_HIGH_OFFSET);
        const memberIdLow = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, MEMBER_ID_LOW_OFFSET);
        const localIdHigh = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, LOCAL_ID_HIGH_OFFSET);
        const localIdLow = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, LOCAL_ID_LOW_OFFSET);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new SqlQueryId_1.SqlQueryId(memberIdHigh, memberIdLow, localIdHigh, localIdLow);
    }
}
exports.SqlQueryIdCodec = SqlQueryIdCodec;
//# sourceMappingURL=SqlQueryIdCodec.js.map