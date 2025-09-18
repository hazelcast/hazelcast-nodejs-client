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
exports.CPGroupCreateCPGroupCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const RaftGroupIdCodec_1 = require("./custom/RaftGroupIdCodec");
// hex: 0x1E0100
const REQUEST_MESSAGE_TYPE = 1966336;
// hex: 0x1E0101
// RESPONSE_MESSAGE_TYPE = 1966337
const REQUEST_INITIAL_FRAME_SIZE = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
/** @internal */
class CPGroupCreateCPGroupCodec {
    static encodeRequest(proxyName) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, proxyName);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        // empty initial frame
        clientMessage.nextFrame();
        return RaftGroupIdCodec_1.RaftGroupIdCodec.decode(clientMessage);
    }
}
exports.CPGroupCreateCPGroupCodec = CPGroupCreateCPGroupCodec;
//# sourceMappingURL=CPGroupCreateCPGroupCodec.js.map