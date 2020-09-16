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
import * as Long from 'long';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';
import {CodecUtil} from './builtin/CodecUtil';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {LongArrayCodec} from './builtin/LongArrayCodec';

// hex: 0x170900
const REQUEST_MESSAGE_TYPE = 1509632;
// hex: 0x170901
// RESPONSE_MESSAGE_TYPE = 1509633

const REQUEST_START_SEQUENCE_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_MIN_COUNT_OFFSET = REQUEST_START_SEQUENCE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_MAX_COUNT_OFFSET = REQUEST_MIN_COUNT_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_MAX_COUNT_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_READ_COUNT_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_NEXT_SEQ_OFFSET = RESPONSE_READ_COUNT_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;


/** @internal */
export interface RingbufferReadManyResponseParams {
    readCount: number;
    items: Data[];
    itemSeqs: Long[];
    nextSeq: Long;
}

/** @internal */
export class RingbufferReadManyCodec {
    static encodeRequest(name: string, startSequence: Long, minCount: number, maxCount: number, filter: Data): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_START_SEQUENCE_OFFSET, startSequence);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_MIN_COUNT_OFFSET, minCount);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_MAX_COUNT_OFFSET, maxCount);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        CodecUtil.encodeNullable(clientMessage, filter, DataCodec.encode);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): RingbufferReadManyResponseParams {
        const initialFrame = clientMessage.nextFrame();

        const response = {} as RingbufferReadManyResponseParams;
        response.readCount = FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_READ_COUNT_OFFSET);
        response.nextSeq = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_NEXT_SEQ_OFFSET);
        response.items = ListMultiFrameCodec.decode(clientMessage, DataCodec.decode);
        response.itemSeqs = CodecUtil.decodeNullable(clientMessage, LongArrayCodec.decode);

        return response;
    }
}
