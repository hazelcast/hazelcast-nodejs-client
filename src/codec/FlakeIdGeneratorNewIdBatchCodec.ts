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
import * as Long from 'long';

// hex: 0x1C0100
const REQUEST_MESSAGE_TYPE = 1835264;
// hex: 0x1C0101
const RESPONSE_MESSAGE_TYPE = 1835265;

const REQUEST_BATCH_SIZE_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_BATCH_SIZE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const RESPONSE_BASE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_INCREMENT_OFFSET = RESPONSE_BASE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_BATCH_SIZE_OFFSET = RESPONSE_INCREMENT_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

export interface FlakeIdGeneratorNewIdBatchResponseParams {
    base: Long;
    increment: Long;
    batchSize: number;
}
export class FlakeIdGeneratorNewIdBatchCodec {
    static encodeRequest(name: string, batchSize: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, MESSAGE_TYPE_OFFSET, REQUEST_MESSAGE_TYPE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PARTITION_ID_OFFSET, -1);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_BATCH_SIZE_OFFSET, batchSize);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): FlakeIdGeneratorNewIdBatchResponseParams {
        const iterator = clientMessage.frameIterator();
        const initialFrame = iterator.getNextFrame();

        return {
            base: FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_BASE_OFFSET),
            increment: FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_INCREMENT_OFFSET),
            batchSize: FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_BATCH_SIZE_OFFSET),
        };
    }
}
