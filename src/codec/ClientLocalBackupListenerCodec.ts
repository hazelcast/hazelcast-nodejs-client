/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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
import * as Long from 'long';

// hex: 0x000F00
const REQUEST_MESSAGE_TYPE = 3840;
// hex: 0x000F01
// RESPONSE_MESSAGE_TYPE = 3841
// hex: 0x000F02
const EVENT_BACKUP_MESSAGE_TYPE = 3842;

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_BACKUP_SOURCE_INVOCATION_CORRELATION_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export interface ClientLocalBackupListenerResponseParams {
    response: UUID;
}

/** @internal */
export class ClientLocalBackupListenerCodec {
    static encodeRequest(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): ClientLocalBackupListenerResponseParams {
        const initialFrame = clientMessage.nextFrame();

        const response = {} as ClientLocalBackupListenerResponseParams;
        response.response = FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET);

        return response;
    }

    static handle(clientMessage: ClientMessage, handleBackupEvent: (sourceInvocationCorrelationId: Long) => void = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_BACKUP_MESSAGE_TYPE && handleBackupEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const sourceInvocationCorrelationId = FixSizedTypesCodec.decodeLong(initialFrame.content, EVENT_BACKUP_SOURCE_INVOCATION_CORRELATION_ID_OFFSET);
            handleBackupEvent(sourceInvocationCorrelationId);
            return;
        }
    }
}
