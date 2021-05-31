/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
import {ClientMessage, Frame, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import {SqlQueryIdCodec} from './custom/SqlQueryIdCodec';
import {SqlQueryId} from '../sql/SqlQueryId';
import {SqlPage} from '../sql/SqlPage';
import {SqlPageCodec} from './builtin/SqlPageCodec';
import {CodecUtil} from './builtin/CodecUtil';
import {SqlErrorCodec} from './custom/SqlErrorCodec';
import {SqlError} from '../sql/SqlError';

// hex: 0x210500
const REQUEST_MESSAGE_TYPE = 2163968;
// hex: 0x210501
// RESPONSE_MESSAGE_TYPE = 2163969

const REQUEST_CURSOR_BUFFER_SIZE_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_CURSOR_BUFFER_SIZE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export interface SqlFetchResponseParams {
    rowPage: SqlPage;
    error: SqlError;
}

/** @internal */
export class SqlFetchCodec {
    static encodeRequest(queryId: SqlQueryId, cursorBufferSize: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_CURSOR_BUFFER_SIZE_OFFSET, cursorBufferSize);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        SqlQueryIdCodec.encode(clientMessage, queryId);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): SqlFetchResponseParams {
        // empty initial frame
        clientMessage.nextFrame();

        const response = {} as SqlFetchResponseParams;
        response.rowPage = CodecUtil.decodeNullable(clientMessage, SqlPageCodec.decode);
        response.error = CodecUtil.decodeNullable(clientMessage, SqlErrorCodec.decode);

        return response;
    }
}
