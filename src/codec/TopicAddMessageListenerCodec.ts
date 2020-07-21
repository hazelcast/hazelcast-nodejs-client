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
import {UUID} from '../core/UUID';
import * as Long from 'long';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';

// hex: 0x040200
const REQUEST_MESSAGE_TYPE = 262656;
// hex: 0x040201
// RESPONSE_MESSAGE_TYPE = 262657
// hex: 0x040202
const EVENT_TOPIC_MESSAGE_TYPE = 262658;

const REQUEST_LOCAL_ONLY_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_LOCAL_ONLY_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const EVENT_TOPIC_PUBLISH_TIME_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_TOPIC_UUID_OFFSET = EVENT_TOPIC_PUBLISH_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

export interface TopicAddMessageListenerResponseParams {
    response: UUID;
}

export class TopicAddMessageListenerCodec {
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

    static decodeResponse(clientMessage: ClientMessage): TopicAddMessageListenerResponseParams {
        const initialFrame = clientMessage.nextFrame();

        return {
            response: FixSizedTypesCodec.decodeUUID(initialFrame.content, RESPONSE_RESPONSE_OFFSET),
        };
    }

    static handle(clientMessage: ClientMessage, handleTopicEvent: (item: Data, publishTime: Long, uuid: UUID) => void = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === EVENT_TOPIC_MESSAGE_TYPE && handleTopicEvent !== null) {
            const initialFrame = clientMessage.nextFrame();
            const publishTime = FixSizedTypesCodec.decodeLong(initialFrame.content, EVENT_TOPIC_PUBLISH_TIME_OFFSET);
            const uuid = FixSizedTypesCodec.decodeUUID(initialFrame.content, EVENT_TOPIC_UUID_OFFSET);
            const item = DataCodec.decode(clientMessage);
            handleTopicEvent(item, publishTime, uuid);
            return;
        }
    }
}
