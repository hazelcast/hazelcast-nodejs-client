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
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../ClientMessage';
import {UUID} from '../core/UUID';
import * as Long from 'long';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {DataCodec} from './builtin/DataCodec';

// hex: 0x0F0500
const REQUEST_MESSAGE_TYPE = 984320;
// hex: 0x0F0501
const RESPONSE_MESSAGE_TYPE = 984321;

const REQUEST_TXN_ID_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_THREAD_ID_OFFSET = REQUEST_TXN_ID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_THREAD_ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

export interface TransactionalMultiMapValueCountResponseParams {
    response: number;
}

export class TransactionalMultiMapValueCountCodec {
    static encodeRequest(name: string, txnId: UUID, threadId: Long, key: Data): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeUUID(initialFrame.content, REQUEST_TXN_ID_OFFSET, txnId);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_THREAD_ID_OFFSET, threadId);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, key);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): TransactionalMultiMapValueCountResponseParams {
        const initialFrame = clientMessage.nextFrame();

        return {
            response: FixSizedTypesCodec.decodeInt(initialFrame.content, RESPONSE_RESPONSE_OFFSET),
        };
    }
}
