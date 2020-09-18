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
import {StringCodec} from './builtin/StringCodec';
import {UUID} from '../core/UUID';
import * as Long from 'long';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';
import {CodecUtil} from './builtin/CodecUtil';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {ListUUIDCodec} from './builtin/ListUUIDCodec';
import {ListLongCodec} from './builtin/ListLongCodec';

// hex: 0x013F00
const REQUEST_MESSAGE_TYPE = 81664;
// hex: 0x013F01
// RESPONSE_MESSAGE_TYPE = 81665
// hex: 0x013F02
const EVENT_I_MAP_INVALIDATION_MESSAGE_TYPE = 81666;
// hex: 0x013F03
const EVENT_I_MAP_BATCH_INVALIDATION_MESSAGE_TYPE = 81667;

const REQUEST_LISTENER_FLAGS_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_LOCAL_ONLY_OFFSET = REQUEST_LISTENER_FLAGS_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_I_MAP_INVALIDATION_SOURCE_UUID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_I_MAP_INVALIDATION_PARTITION_UUID_OFFSET = EVENT_I_MAP_INVALIDATION_SOURCE_UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const EVENT_I_MAP_INVALIDATION_SEQUENCE_OFFSET = EVENT_I_MAP_INVALIDATION_PARTITION_UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;

/** @internal */
export class MapAddNearCacheInvalidationListenerCodec {
    static encodeRequest(name: string, listenerFlags: number, localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_LISTENER_FLAGS_OFFSET, listenerFlags);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_LOCAL_ONLY_OFFSET, localOnly);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): UUID {
        const initialFrame = clientMessage.nextFrame();

        return FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET);
    }

    static handle(clientMessage: ClientMessage, handleIMapInvalidationEvent: (key: Data, sourceUuid: UUID, partitionUuid: UUID, sequence: Long) => void = null, handleIMapBatchInvalidationEvent: (keys: Data[], sourceUuids: UUID[], partitionUuids: UUID[], sequences: Long[]) => void = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_I_MAP_INVALIDATION_MESSAGE_TYPE && handleIMapInvalidationEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const sourceUuid = FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_I_MAP_INVALIDATION_SOURCE_UUID_OFFSET);
            const partitionUuid = FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_I_MAP_INVALIDATION_PARTITION_UUID_OFFSET);
            const sequence = FixSizedTypesCodec.decodeLong(initialFrame.content, EVENT_I_MAP_INVALIDATION_SEQUENCE_OFFSET);
            const key = CodecUtil.decodeNullable(clientMessage, DataCodec.decode);
            handleIMapInvalidationEvent(key, sourceUuid, partitionUuid, sequence);
            return;
        }
        if (messageType === EVENT_I_MAP_BATCH_INVALIDATION_MESSAGE_TYPE && handleIMapBatchInvalidationEvent !== null) {
            // empty initial frame
            clientMessage.nextFrame();
            const keys = ListMultiFrameCodec.decode(clientMessage, DataCodec.decode);
            const sourceUuids = ListUUIDCodec.decode(clientMessage);
            const partitionUuids = ListUUIDCodec.decode(clientMessage);
            const sequences = ListLongCodec.decode(clientMessage);
            handleIMapBatchInvalidationEvent(keys, sourceUuids, partitionUuids, sequences);
            return;
        }
    }
}
