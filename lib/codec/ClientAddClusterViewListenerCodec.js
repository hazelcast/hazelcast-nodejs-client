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
exports.ClientAddClusterViewListenerCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const ListMultiFrameCodec_1 = require("./builtin/ListMultiFrameCodec");
const MemberInfoCodec_1 = require("./custom/MemberInfoCodec");
const EntryListUUIDListIntegerCodec_1 = require("./builtin/EntryListUUIDListIntegerCodec");
// hex: 0x000300
const REQUEST_MESSAGE_TYPE = 768;
// hex: 0x000301
// RESPONSE_MESSAGE_TYPE = 769
// hex: 0x000302
const EVENT_MEMBERS_VIEW_MESSAGE_TYPE = 770;
// hex: 0x000303
const EVENT_PARTITIONS_VIEW_MESSAGE_TYPE = 771;
const REQUEST_INITIAL_FRAME_SIZE = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_MEMBERS_VIEW_VERSION_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_PARTITIONS_VIEW_VERSION_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
/** @internal */
class ClientAddClusterViewListenerCodec {
    static encodeRequest() {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        return clientMessage;
    }
    static handle(clientMessage, handleMembersViewEvent = null, handlePartitionsViewEvent = null) {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_MEMBERS_VIEW_MESSAGE_TYPE && handleMembersViewEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const version = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_MEMBERS_VIEW_VERSION_OFFSET);
            const memberInfos = ListMultiFrameCodec_1.ListMultiFrameCodec.decode(clientMessage, MemberInfoCodec_1.MemberInfoCodec.decode);
            handleMembersViewEvent(version, memberInfos);
            return;
        }
        if (messageType === EVENT_PARTITIONS_VIEW_MESSAGE_TYPE && handlePartitionsViewEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const version = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_PARTITIONS_VIEW_VERSION_OFFSET);
            const partitions = EntryListUUIDListIntegerCodec_1.EntryListUUIDListIntegerCodec.decode(clientMessage);
            handlePartitionsViewEvent(version, partitions);
            return;
        }
    }
}
exports.ClientAddClusterViewListenerCodec = ClientAddClusterViewListenerCodec;
//# sourceMappingURL=ClientAddClusterViewListenerCodec.js.map