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
exports.MapTryLockCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const DataCodec_1 = require("./builtin/DataCodec");
// hex: 0x011100
const REQUEST_MESSAGE_TYPE = 69888;
// hex: 0x011101
// RESPONSE_MESSAGE_TYPE = 69889
const REQUEST_THREAD_ID_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_LEASE_OFFSET = REQUEST_THREAD_ID_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_TIMEOUT_OFFSET = REQUEST_LEASE_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_REFERENCE_ID_OFFSET = REQUEST_TIMEOUT_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_REFERENCE_ID_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
/** @internal */
class MapTryLockCodec {
    static encodeRequest(name, key, threadId, lease, timeout, referenceId) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        clientMessage.setContainsSerializedDataInRequest(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_THREAD_ID_OFFSET, threadId);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_LEASE_OFFSET, lease);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_TIMEOUT_OFFSET, timeout);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_REFERENCE_ID_OFFSET, referenceId);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, name);
        DataCodec_1.DataCodec.encode(clientMessage, key);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        return FixSizedTypesCodec_1.FixSizedTypesCodec.decodeBoolean(initialFrame.content, RESPONSE_RESPONSE_OFFSET);
    }
}
exports.MapTryLockCodec = MapTryLockCodec;
//# sourceMappingURL=MapTryLockCodec.js.map