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
import {StringCodec} from './builtin/StringCodec';
import * as Long from 'long';

// hex: 0x014100
const REQUEST_MESSAGE_TYPE = 82176;
// hex: 0x014101
// RESPONSE_MESSAGE_TYPE = 82177

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_OLDEST_SEQUENCE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_NEWEST_SEQUENCE_OFFSET = RESPONSE_OLDEST_SEQUENCE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

/** @internal */
export interface MapEventJournalSubscribeResponseParams {
    oldestSequence: Long;
    newestSequence: Long;
}

/** @internal */
export class MapEventJournalSubscribeCodec {
    static encodeRequest(name: string): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapEventJournalSubscribeResponseParams {
        const initialFrame = clientMessage.nextFrame();

        const response = {} as MapEventJournalSubscribeResponseParams;
        response.oldestSequence = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_OLDEST_SEQUENCE_OFFSET);
        response.newestSequence = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_NEWEST_SEQUENCE_OFFSET);

        return response;
    }
}
