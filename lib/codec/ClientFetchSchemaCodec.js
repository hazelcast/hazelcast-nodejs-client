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
exports.ClientFetchSchemaCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const SchemaCodec_1 = require("./custom/SchemaCodec");
const CodecUtil_1 = require("./builtin/CodecUtil");
// hex: 0x001400
const REQUEST_MESSAGE_TYPE = 5120;
// hex: 0x001401
// RESPONSE_MESSAGE_TYPE = 5121
const REQUEST_SCHEMA_ID_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_SCHEMA_ID_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class ClientFetchSchemaCodec {
    static encodeRequest(schemaId) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_SCHEMA_ID_OFFSET, schemaId);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        // empty initial frame
        clientMessage.nextFrame();
        return CodecUtil_1.CodecUtil.decodeNullable(clientMessage, SchemaCodec_1.SchemaCodec.decode);
    }
}
exports.ClientFetchSchemaCodec = ClientFetchSchemaCodec;
//# sourceMappingURL=ClientFetchSchemaCodec.js.map