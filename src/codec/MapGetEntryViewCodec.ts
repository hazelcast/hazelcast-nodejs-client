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
import * as Long from 'long';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';
import {SimpleEntryView} from '../core/SimpleEntryView';
import {SimpleEntryViewCodec} from './custom/SimpleEntryViewCodec';
import {CodecUtil} from './builtin/CodecUtil';

// hex: 0x011D00
const REQUEST_MESSAGE_TYPE = 72960;
// hex: 0x011D01
// RESPONSE_MESSAGE_TYPE = 72961

const REQUEST_THREAD_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_THREAD_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_MAX_IDLE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

export interface MapGetEntryViewResponseParams {
    response: SimpleEntryView<Data, Data>;
    maxIdle: Long;
}

export class MapGetEntryViewCodec {
    static encodeRequest(name: string, key: Data, threadId: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_THREAD_ID_OFFSET, threadId);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, key);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapGetEntryViewResponseParams {
        const initialFrame = clientMessage.nextFrame();

        const response = {} as MapGetEntryViewResponseParams;
        response.maxIdle = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_MAX_IDLE_OFFSET);
        response.response = CodecUtil.decodeNullable(clientMessage, SimpleEntryViewCodec.decode);

        return response;
    }
}
