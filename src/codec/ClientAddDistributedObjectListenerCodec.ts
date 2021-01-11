/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

/* eslint-disable max-len */
import {BitsUtil} from '../util/BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import {UUID} from '../core/UUID';
import {StringCodec} from './builtin/StringCodec';

// hex: 0x000900
const REQUEST_MESSAGE_TYPE = 2304;
// hex: 0x000901
// RESPONSE_MESSAGE_TYPE = 2305
// hex: 0x000902
const EVENT_DISTRIBUTED_OBJECT_MESSAGE_TYPE = 2306;

const REQUEST_LOCAL_ONLY_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_DISTRIBUTED_OBJECT_SOURCE_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class ClientAddDistributedObjectListenerCodec {
    static encodeRequest(localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_LOCAL_ONLY_OFFSET, localOnly);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): UUID {
        const initialFrame = clientMessage.nextFrame();

        return FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET);
    }

    static handle(clientMessage: ClientMessage, handleDistributedObjectEvent: (name: string, serviceName: string, eventType: string, source: UUID) => void = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_DISTRIBUTED_OBJECT_MESSAGE_TYPE && handleDistributedObjectEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const source = FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_DISTRIBUTED_OBJECT_SOURCE_OFFSET);
            const name = StringCodec.decode(clientMessage);
            const serviceName = StringCodec.decode(clientMessage);
            const eventType = StringCodec.decode(clientMessage);
            handleDistributedObjectEvent(name, serviceName, eventType, source);
            return;
        }
    }
}
