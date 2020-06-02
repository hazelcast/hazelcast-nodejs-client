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
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {UUID} from '../core/UUID';

// hex: 0x011B00
const REQUEST_MESSAGE_TYPE = 72448;
// hex: 0x011B01
const RESPONSE_MESSAGE_TYPE = 72449;
// hex: 0x011B02
const EVENT_MAP_PARTITION_LOST_MESSAGE_TYPE = 72450;

const REQUEST_LOCAL_ONLY_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_MAP_PARTITION_LOST_PARTITION_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_MAP_PARTITION_LOST_UUID_OFFSET = EVENT_MAP_PARTITION_LOST_PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface MapAddPartitionLostListenerResponseParams {
    response: UUID;
}
export class MapAddPartitionLostListenerCodec {
    static encodeRequest(name: string, localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_LOCAL_ONLY_OFFSET, localOnly);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapAddPartitionLostListenerResponseParams {
        const initialFrame = clientMessage.nextFrame();

        return {
            response: FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET),
        };
    }

    static handle(clientMessage: ClientMessage, handleMapPartitionLostEvent: (partitionId: number, uuid: UUID) => void = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_MAP_PARTITION_LOST_MESSAGE_TYPE && handleMapPartitionLostEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const partitionId = FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_MAP_PARTITION_LOST_PARTITION_ID_OFFSET);
            const uuid = FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_MAP_PARTITION_LOST_UUID_OFFSET);
            handleMapPartitionLostEvent(partitionId, uuid);
            return;
        }
    }
}
