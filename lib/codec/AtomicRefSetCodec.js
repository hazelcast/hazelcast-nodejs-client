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
exports.AtomicRefSetCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const RaftGroupIdCodec_1 = require("./custom/RaftGroupIdCodec");
const StringCodec_1 = require("./builtin/StringCodec");
const DataCodec_1 = require("./builtin/DataCodec");
const CodecUtil_1 = require("./builtin/CodecUtil");
// hex: 0x0A0500
const REQUEST_MESSAGE_TYPE = 656640;
// hex: 0x0A0501
// RESPONSE_MESSAGE_TYPE = 656641
const REQUEST_RETURN_OLD_VALUE_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_RETURN_OLD_VALUE_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES;
/** @internal */
class AtomicRefSetCodec {
    static encodeRequest(groupId, name, newValue, returnOldValue) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setContainsSerializedDataInRequest(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_RETURN_OLD_VALUE_OFFSET, returnOldValue);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        RaftGroupIdCodec_1.RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec_1.StringCodec.encode(clientMessage, name);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, newValue, DataCodec_1.DataCodec.encode);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        // empty initial frame
        clientMessage.nextFrame();
        return CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
    }
}
exports.AtomicRefSetCodec = AtomicRefSetCodec;
//# sourceMappingURL=AtomicRefSetCodec.js.map