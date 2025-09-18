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
exports.ReplicatedMapAddEntryListenerWithPredicateCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const DataCodec_1 = require("./builtin/DataCodec");
const CodecUtil_1 = require("./builtin/CodecUtil");
// hex: 0x0D0B00
const REQUEST_MESSAGE_TYPE = 854784;
// hex: 0x0D0B01
// RESPONSE_MESSAGE_TYPE = 854785
// hex: 0x0D0B02
const EVENT_ENTRY_MESSAGE_TYPE = 854786;
const REQUEST_LOCAL_ONLY_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_ENTRY_EVENT_TYPE_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_ENTRY_UUID_OFFSET = EVENT_ENTRY_EVENT_TYPE_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_OFFSET = EVENT_ENTRY_UUID_OFFSET + BitsUtil_1.BitsUtil.UUID_SIZE_IN_BYTES;
/** @internal */
class ReplicatedMapAddEntryListenerWithPredicateCodec {
    static encodeRequest(name, predicate, localOnly) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setContainsSerializedDataInRequest(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_LOCAL_ONLY_OFFSET, localOnly);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, name);
        DataCodec_1.DataCodec.encode(clientMessage, predicate);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        return FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET);
    }
    static handle(clientMessage, handleEntryEvent = null) {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_ENTRY_MESSAGE_TYPE && handleEntryEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const eventType = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_ENTRY_EVENT_TYPE_OFFSET);
            const uuid = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_ENTRY_UUID_OFFSET);
            const numberOfAffectedEntries = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_OFFSET);
            const key = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
            const value = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
            const oldValue = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
            const mergingValue = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
            handleEntryEvent(key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries);
            return;
        }
    }
}
exports.ReplicatedMapAddEntryListenerWithPredicateCodec = ReplicatedMapAddEntryListenerWithPredicateCodec;
//# sourceMappingURL=ReplicatedMapAddEntryListenerWithPredicateCodec.js.map