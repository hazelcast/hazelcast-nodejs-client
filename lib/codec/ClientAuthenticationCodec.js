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
exports.ClientAuthenticationCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const CodecUtil_1 = require("./builtin/CodecUtil");
const ListMultiFrameCodec_1 = require("./builtin/ListMultiFrameCodec");
const AddressCodec_1 = require("./custom/AddressCodec");
// hex: 0x000100
const REQUEST_MESSAGE_TYPE = 256;
// hex: 0x000101
// RESPONSE_MESSAGE_TYPE = 257
const REQUEST_UUID_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_SERIALIZATION_VERSION_OFFSET = REQUEST_UUID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_SERIALIZATION_VERSION_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_STATUS_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_MEMBER_UUID_OFFSET = RESPONSE_STATUS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_SERIALIZATION_VERSION_OFFSET = RESPONSE_MEMBER_UUID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
const RESPONSE_PARTITION_COUNT_OFFSET = RESPONSE_SERIALIZATION_VERSION_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_CLUSTER_ID_OFFSET = RESPONSE_PARTITION_COUNT_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_FAILOVER_SUPPORTED_OFFSET = RESPONSE_CLUSTER_ID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
/** @internal */
class ClientAuthenticationCodec {
    static encodeRequest(clusterName, username, password, uuid, clientType, serializationVersion, clientHazelcastVersion, clientName, labels) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeUUID(initialFrame.content, REQUEST_UUID_OFFSET, uuid);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeByte(initialFrame.content, REQUEST_SERIALIZATION_VERSION_OFFSET, serializationVersion);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, clusterName);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, username, StringCodec_1.StringCodec.encode);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, password, StringCodec_1.StringCodec.encode);
        StringCodec_1.StringCodec.encode(clientMessage, clientType);
        StringCodec_1.StringCodec.encode(clientMessage, clientHazelcastVersion);
        StringCodec_1.StringCodec.encode(clientMessage, clientName);
        ListMultiFrameCodec_1.ListMultiFrameCodec.encode(clientMessage, labels, StringCodec_1.StringCodec.encode);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        const response = {};
        response.status = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte(initialFrame.content, RESPONSE_STATUS_OFFSET);
        response.memberUuid = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_MEMBER_UUID_OFFSET);
        response.serializationVersion = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte(initialFrame.content, RESPONSE_SERIALIZATION_VERSION_OFFSET);
        response.partitionCount = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_PARTITION_COUNT_OFFSET);
        response.clusterId = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_CLUSTER_ID_OFFSET);
        response.failoverSupported = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeBoolean(initialFrame.content, RESPONSE_FAILOVER_SUPPORTED_OFFSET);
        response.address = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, AddressCodec_1.AddressCodec.decode);
        response.serverHazelcastVersion = StringCodec_1.StringCodec.decode(clientMessage);
        return response;
    }
}
exports.ClientAuthenticationCodec = ClientAuthenticationCodec;
//# sourceMappingURL=ClientAuthenticationCodec.js.map