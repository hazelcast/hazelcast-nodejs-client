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
import {ClientMessage, Frame, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {UUID} from '../core/UUID';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {StringCodec} from './builtin/StringCodec';
import {EntryListCodec} from './builtin/EntryListCodec';
import {EntryListIntegerLongCodec} from './builtin/EntryListIntegerLongCodec';
import * as Long from 'long';
import {EntryListIntegerUUIDCodec} from './builtin/EntryListIntegerUUIDCodec';

// hex: 0x013D00
const REQUEST_MESSAGE_TYPE = 81152;
// hex: 0x013D01
const RESPONSE_MESSAGE_TYPE = 81153;

const REQUEST_UUID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;

export interface MapFetchNearCacheInvalidationMetadataResponseParams {
    namePartitionSequenceList: Array<[string, Array<[number, Long]>]>;
    partitionUuidList: Array<[number, UUID]>;
}
export class MapFetchNearCacheInvalidationMetadataCodec {
    static encodeRequest(names: string[], uuid: UUID): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeUUID(initialFrame.content, REQUEST_UUID_OFFSET, uuid);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        ListMultiFrameCodec.encode(clientMessage, names, StringCodec.encode);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapFetchNearCacheInvalidationMetadataResponseParams {
        const iterator = clientMessage.frameIterator();
        // empty initial frame
        iterator.getNextFrame();

        return {
            namePartitionSequenceList: EntryListCodec.decode(iterator, StringCodec.decode, EntryListIntegerLongCodec.decode),
            partitionUuidList: EntryListIntegerUUIDCodec.decode(iterator),
        };
    }
}
