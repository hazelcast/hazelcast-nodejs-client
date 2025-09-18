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
exports.MapAddNearCacheInvalidationListenerCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const DataCodec_1 = require("./builtin/DataCodec");
const CodecUtil_1 = require("./builtin/CodecUtil");
const ListMultiFrameCodec_1 = require("./builtin/ListMultiFrameCodec");
const ListUUIDCodec_1 = require("./builtin/ListUUIDCodec");
const ListLongCodec_1 = require("./builtin/ListLongCodec");
// hex: 0x013F00
const REQUEST_MESSAGE_TYPE = 81664;
// hex: 0x013F01
// RESPONSE_MESSAGE_TYPE = 81665
// hex: 0x013F02
const EVENT_I_MAP_INVALIDATION_MESSAGE_TYPE = 81666;
// hex: 0x013F03
const EVENT_I_MAP_BATCH_INVALIDATION_MESSAGE_TYPE = 81667;
const REQUEST_LISTENER_FLAGS_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_LOCAL_ONLY_OFFSET = REQUEST_LISTENER_FLAGS_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_I_MAP_INVALIDATION_SOURCE_UUID_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_I_MAP_INVALIDATION_PARTITION_UUID_OFFSET = EVENT_I_MAP_INVALIDATION_SOURCE_UUID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
const EVENT_I_MAP_INVALIDATION_SEQUENCE_OFFSET = EVENT_I_MAP_INVALIDATION_PARTITION_UUID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
/** @internal */
class MapAddNearCacheInvalidationListenerCodec {
    static encodeRequest(name, listenerFlags, localOnly) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_LISTENER_FLAGS_OFFSET, listenerFlags);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_LOCAL_ONLY_OFFSET, localOnly);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, name);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        return FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET);
    }
    static handle(clientMessage, handleIMapInvalidationEvent = null, handleIMapBatchInvalidationEvent = null) {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_I_MAP_INVALIDATION_MESSAGE_TYPE && handleIMapInvalidationEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const sourceUuid = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_I_MAP_INVALIDATION_SOURCE_UUID_OFFSET);
            const partitionUuid = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_I_MAP_INVALIDATION_PARTITION_UUID_OFFSET);
            const sequence = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, EVENT_I_MAP_INVALIDATION_SEQUENCE_OFFSET);
            const key = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
            handleIMapInvalidationEvent(key, sourceUuid, partitionUuid, sequence);
            return;
        }
        if (messageType === EVENT_I_MAP_BATCH_INVALIDATION_MESSAGE_TYPE && handleIMapBatchInvalidationEvent !== null) {
            // empty initial frame
            clientMessage.nextFrame();
            const keys = ListMultiFrameCodec_1.ListMultiFrameCodec.decode(clientMessage, DataCodec_1.DataCodec.decode);
            const sourceUuids = ListUUIDCodec_1.ListUUIDCodec.decode(clientMessage);
            const partitionUuids = ListUUIDCodec_1.ListUUIDCodec.decode(clientMessage);
            const sequences = ListLongCodec_1.ListLongCodec.decode(clientMessage);
            handleIMapBatchInvalidationEvent(keys, sourceUuids, partitionUuids, sequences);
            return;
        }
    }
}
exports.MapAddNearCacheInvalidationListenerCodec = MapAddNearCacheInvalidationListenerCodec;
//# sourceMappingURL=MapAddNearCacheInvalidationListenerCodec.js.map