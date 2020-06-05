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

/*tslint:disable:max-line-length*/
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {UUID} from '../core/UUID';
import {CodecUtil} from './builtin/CodecUtil';

// hex: 0x000600
const REQUEST_MESSAGE_TYPE = 1536;
// hex: 0x000601
const RESPONSE_MESSAGE_TYPE = 1537;
// hex: 0x000602
const EVENT_PARTITION_LOST_MESSAGE_TYPE = 1538;

const REQUEST_LOCAL_ONLY_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_PARTITION_LOST_PARTITION_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_PARTITION_LOST_LOST_BACKUP_COUNT_OFFSET = EVENT_PARTITION_LOST_PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_PARTITION_LOST_SOURCE_OFFSET = EVENT_PARTITION_LOST_LOST_BACKUP_COUNT_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface ClientAddPartitionLostListenerResponseParams {
    response: UUID;
}

export class ClientAddPartitionLostListenerCodec {
    static encodeRequest(localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE, UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_LOCAL_ONLY_OFFSET, localOnly);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): ClientAddPartitionLostListenerResponseParams {
        const initialFrame = clientMessage.nextFrame();

        return {
            response: FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET),
        };
    }

    static handle(clientMessage: ClientMessage, handlePartitionLostEvent: (partitionId: number, lostBackupCount: number, source: UUID) => void = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_PARTITION_LOST_MESSAGE_TYPE && handlePartitionLostEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const partitionId = FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_PARTITION_LOST_PARTITION_ID_OFFSET);
            const lostBackupCount = FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_PARTITION_LOST_LOST_BACKUP_COUNT_OFFSET);
            const source = FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_PARTITION_LOST_SOURCE_OFFSET);
            handlePartitionLostEvent(partitionId, lostBackupCount, source);
            return;
        }
    }
}
