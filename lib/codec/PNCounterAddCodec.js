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
exports.PNCounterAddCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const EntryListUUIDLongCodec_1 = require("./builtin/EntryListUUIDLongCodec");
// hex: 0x1D0200
const REQUEST_MESSAGE_TYPE = 1901056;
// hex: 0x1D0201
// RESPONSE_MESSAGE_TYPE = 1901057
const REQUEST_DELTA_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_GET_BEFORE_UPDATE_OFFSET = REQUEST_DELTA_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_TARGET_REPLICA_UUID_OFFSET = REQUEST_GET_BEFORE_UPDATE_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_TARGET_REPLICA_UUID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
const RESPONSE_VALUE_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_REPLICA_COUNT_OFFSET = RESPONSE_VALUE_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class PNCounterAddCodec {
    static encodeRequest(name, delta, getBeforeUpdate, replicaTimestamps, targetReplicaUUID) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_DELTA_OFFSET, delta);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_GET_BEFORE_UPDATE_OFFSET, getBeforeUpdate);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeUUID(initialFrame.content, REQUEST_TARGET_REPLICA_UUID_OFFSET, targetReplicaUUID);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, name);
        EntryListUUIDLongCodec_1.EntryListUUIDLongCodec.encode(clientMessage, replicaTimestamps);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        const response = {};
        response.value = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_VALUE_OFFSET);
        response.replicaCount = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_REPLICA_COUNT_OFFSET);
        response.replicaTimestamps = EntryListUUIDLongCodec_1.EntryListUUIDLongCodec.decode(clientMessage);
        return response;
    }
}
exports.PNCounterAddCodec = PNCounterAddCodec;
//# sourceMappingURL=PNCounterAddCodec.js.map