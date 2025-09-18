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
exports.RaftGroupIdCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const RaftGroupId_1 = require("../../proxy/cpsubsystem/RaftGroupId");
const StringCodec_1 = require("../builtin/StringCodec");
const SEED_OFFSET = 0;
const ID_OFFSET = SEED_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = ID_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class RaftGroupIdCodec {
    static encode(clientMessage, raftGroupId) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, SEED_OFFSET, raftGroupId.seed);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, ID_OFFSET, raftGroupId.id);
        clientMessage.addFrame(initialFrame);
        StringCodec_1.StringCodec.encode(clientMessage, raftGroupId.name);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const seed = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, SEED_OFFSET);
        const id = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, ID_OFFSET);
        const name = StringCodec_1.StringCodec.decode(clientMessage);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new RaftGroupId_1.RaftGroupId(name, seed, id);
    }
}
exports.RaftGroupIdCodec = RaftGroupIdCodec;
//# sourceMappingURL=RaftGroupIdCodec.js.map