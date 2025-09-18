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
exports.CPSessionCreateSessionCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const RaftGroupIdCodec_1 = require("./custom/RaftGroupIdCodec");
const StringCodec_1 = require("./builtin/StringCodec");
// hex: 0x1F0100
const REQUEST_MESSAGE_TYPE = 2031872;
// hex: 0x1F0101
// RESPONSE_MESSAGE_TYPE = 2031873
const REQUEST_INITIAL_FRAME_SIZE = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_SESSION_ID_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_TTL_MILLIS_OFFSET = RESPONSE_SESSION_ID_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_HEARTBEAT_MILLIS_OFFSET = RESPONSE_TTL_MILLIS_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class CPSessionCreateSessionCodec {
    static encodeRequest(groupId, endpointName) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        RaftGroupIdCodec_1.RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec_1.StringCodec.encode(clientMessage, endpointName);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        const response = {};
        response.sessionId = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_SESSION_ID_OFFSET);
        response.ttlMillis = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_TTL_MILLIS_OFFSET);
        response.heartbeatMillis = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_HEARTBEAT_MILLIS_OFFSET);
        return response;
    }
}
exports.CPSessionCreateSessionCodec = CPSessionCreateSessionCodec;
//# sourceMappingURL=CPSessionCreateSessionCodec.js.map