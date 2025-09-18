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
exports.MemberVersionCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const MemberVersion_1 = require("../../core/MemberVersion");
const MAJOR_OFFSET = 0;
const MINOR_OFFSET = MAJOR_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const PATCH_OFFSET = MINOR_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = PATCH_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
/** @internal */
class MemberVersionCodec {
    static encode(clientMessage, memberVersion) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeByte(initialFrame.content, MAJOR_OFFSET, memberVersion.major);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeByte(initialFrame.content, MINOR_OFFSET, memberVersion.minor);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeByte(initialFrame.content, PATCH_OFFSET, memberVersion.patch);
        clientMessage.addFrame(initialFrame);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const major = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte(initialFrame.content, MAJOR_OFFSET);
        const minor = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte(initialFrame.content, MINOR_OFFSET);
        const patch = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte(initialFrame.content, PATCH_OFFSET);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new MemberVersion_1.MemberVersion(major, minor, patch);
    }
}
exports.MemberVersionCodec = MemberVersionCodec;
//# sourceMappingURL=MemberVersionCodec.js.map