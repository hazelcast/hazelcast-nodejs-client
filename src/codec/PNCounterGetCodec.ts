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
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../ClientMessage';
import {UUID} from '../core/UUID';
import {StringCodec} from './builtin/StringCodec';
import {EntryListUUIDLongCodec} from './builtin/EntryListUUIDLongCodec';
import * as Long from 'long';

// hex: 0x1D0100
const REQUEST_MESSAGE_TYPE = 1900800;
// hex: 0x1D0101
// RESPONSE_MESSAGE_TYPE = 1900801

const REQUEST_TARGET_REPLICA_UUID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_TARGET_REPLICA_UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const RESPONSE_VALUE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_REPLICA_COUNT_OFFSET = RESPONSE_VALUE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

export interface PNCounterGetResponseParams {
    value: Long;
    replicaTimestamps: Array<[UUID, Long]>;
    replicaCount: number;
}

export class PNCounterGetCodec {
    static encodeRequest(name: string, replicaTimestamps: Array<[UUID, Long]>, targetReplicaUUID: UUID): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeUUID(initialFrame.content, REQUEST_TARGET_REPLICA_UUID_OFFSET, targetReplicaUUID);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        EntryListUUIDLongCodec.encode(clientMessage, replicaTimestamps);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): PNCounterGetResponseParams {
        const initialFrame = clientMessage.nextFrame();

        return {
            value: FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_VALUE_OFFSET),
            replicaCount: FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_REPLICA_COUNT_OFFSET),
            replicaTimestamps: EntryListUUIDLongCodec.decode(clientMessage),
        };
    }
}
