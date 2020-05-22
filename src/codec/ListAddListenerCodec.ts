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
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, MESSAGE_TYPE_OFFSET, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {UUID} from '../core/UUID';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';
import {CodecUtil} from './builtin/CodecUtil';

// hex: 0x050B00
const REQUEST_MESSAGE_TYPE = 330496;
// hex: 0x050B01
const RESPONSE_MESSAGE_TYPE = 330497;
// hex: 0x050B02
const EVENT_ITEM_MESSAGE_TYPE = 330498;

const REQUEST_INCLUDE_VALUE_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_LOCAL_ONLY_OFFSET = REQUEST_INCLUDE_VALUE_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_ITEM_UUID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_ITEM_EVENT_TYPE_OFFSET = EVENT_ITEM_UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;

export interface ListAddListenerResponseParams {
    response: UUID;
}
export class ListAddListenerCodec {
    static encodeRequest(name: string, includeValue: boolean, localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, MESSAGE_TYPE_OFFSET, REQUEST_MESSAGE_TYPE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PARTITION_ID_OFFSET, -1);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_INCLUDE_VALUE_OFFSET, includeValue);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_LOCAL_ONLY_OFFSET, localOnly);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): ListAddListenerResponseParams {
        const iterator = clientMessage.frameIterator();
        const initialFrame = iterator.getNextFrame();

        return {
            response: FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET),
        };
    }

    static handle(clientMessage: ClientMessage, handleItemEvent: (item: Data, uuid: UUID, eventType: number) => void = null): void {
        const messageType = clientMessage.getMessageType();
        const iterator = clientMessage.frameIterator();
        if (messageType === EVENT_ITEM_MESSAGE_TYPE && handleItemEvent !== null) {
            const initialFrame = iterator.getNextFrame();
            const uuid = FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_ITEM_UUID_OFFSET);
            const eventType = FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_ITEM_EVENT_TYPE_OFFSET);
            const item = CodecUtil.decodeNullable(iterator, DataCodec.decode);
            handleItemEvent(item, uuid, eventType);
            return;
        }
    }
}
