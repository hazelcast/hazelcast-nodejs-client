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
exports.ClientAddDistributedObjectListenerCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
// hex: 0x000900
const REQUEST_MESSAGE_TYPE = 2304;
// hex: 0x000901
// RESPONSE_MESSAGE_TYPE = 2305
// hex: 0x000902
const EVENT_DISTRIBUTED_OBJECT_MESSAGE_TYPE = 2306;
const REQUEST_LOCAL_ONLY_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_DISTRIBUTED_OBJECT_SOURCE_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
/** @internal */
class ClientAddDistributedObjectListenerCodec {
    static encodeRequest(localOnly) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_LOCAL_ONLY_OFFSET, localOnly);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        return FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET);
    }
    static handle(clientMessage, handleDistributedObjectEvent = null) {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_DISTRIBUTED_OBJECT_MESSAGE_TYPE && handleDistributedObjectEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const source = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_DISTRIBUTED_OBJECT_SOURCE_OFFSET);
            const name = StringCodec_1.StringCodec.decode(clientMessage);
            const serviceName = StringCodec_1.StringCodec.decode(clientMessage);
            const eventType = StringCodec_1.StringCodec.decode(clientMessage);
            handleDistributedObjectEvent(name, serviceName, eventType, source);
            return;
        }
    }
}
exports.ClientAddDistributedObjectListenerCodec = ClientAddDistributedObjectListenerCodec;
//# sourceMappingURL=ClientAddDistributedObjectListenerCodec.js.map