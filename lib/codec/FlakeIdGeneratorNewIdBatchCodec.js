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
exports.FlakeIdGeneratorNewIdBatchCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
// hex: 0x1C0100
const REQUEST_MESSAGE_TYPE = 1835264;
// hex: 0x1C0101
// RESPONSE_MESSAGE_TYPE = 1835265
const REQUEST_BATCH_SIZE_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_BATCH_SIZE_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_BASE_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_INCREMENT_OFFSET = RESPONSE_BASE_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_BATCH_SIZE_OFFSET = RESPONSE_INCREMENT_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class FlakeIdGeneratorNewIdBatchCodec {
    static encodeRequest(name, batchSize) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_BATCH_SIZE_OFFSET, batchSize);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, name);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        const response = {};
        response.base = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_BASE_OFFSET);
        response.increment = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_INCREMENT_OFFSET);
        response.batchSize = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_BATCH_SIZE_OFFSET);
        return response;
    }
}
exports.FlakeIdGeneratorNewIdBatchCodec = FlakeIdGeneratorNewIdBatchCodec;
//# sourceMappingURL=FlakeIdGeneratorNewIdBatchCodec.js.map