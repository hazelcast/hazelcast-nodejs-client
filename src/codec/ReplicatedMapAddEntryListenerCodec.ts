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

/* eslint-disable max-len */
import {BitsUtil} from '../util/BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {UUID} from '../core/UUID';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';
import {CodecUtil} from './builtin/CodecUtil';

// hex: 0x0D0D00
const REQUEST_MESSAGE_TYPE = 855296;
// hex: 0x0D0D01
// RESPONSE_MESSAGE_TYPE = 855297
// hex: 0x0D0D02
const EVENT_ENTRY_MESSAGE_TYPE = 855298;

const REQUEST_LOCAL_ONLY_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_ENTRY_EVENT_TYPE_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_ENTRY_UUID_OFFSET = EVENT_ENTRY_EVENT_TYPE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_OFFSET = EVENT_ENTRY_UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;

/** @internal */
export class ReplicatedMapAddEntryListenerCodec {
    static encodeRequest(name: string, localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
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

    static handle(clientMessage: ClientMessage, handleEntryEvent: (key: Data, value: Data, oldValue: Data, mergingValue: Data, eventType: number, uuid: UUID, numberOfAffectedEntries: number) => void = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_ENTRY_MESSAGE_TYPE && handleEntryEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const eventType = FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_ENTRY_EVENT_TYPE_OFFSET);
            const uuid = FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_ENTRY_UUID_OFFSET);
            const numberOfAffectedEntries = FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_OFFSET);
            const key = CodecUtil.decodeNullable(clientMessage, DataCodec.decode);
            const value = CodecUtil.decodeNullable(clientMessage, DataCodec.decode);
            const oldValue = CodecUtil.decodeNullable(clientMessage, DataCodec.decode);
            const mergingValue = CodecUtil.decodeNullable(clientMessage, DataCodec.decode);
            handleEntryEvent(key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries);
            return;
        }
    }
}
