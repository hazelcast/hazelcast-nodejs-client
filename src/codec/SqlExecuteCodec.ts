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
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import * as Long from 'long';
import {StringCodec} from './builtin/StringCodec';
import {Data} from '../serialization/Data';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {DataCodec} from './builtin/DataCodec';
import {CodecUtil} from './builtin/CodecUtil';
import {SqlQueryIdCodec} from './custom/SqlQueryIdCodec';
import {SqlQueryId} from '../sql/SqlQueryId';
import {SqlColumnMetadataCodec} from './custom/SqlColumnMetadataCodec';
import {SqlColumnMetadataImpl} from '../sql/SqlColumnMetadata';
import {SqlPage} from '../sql/SqlPage';
import {SqlPageCodec} from './builtin/SqlPageCodec';
import {SqlErrorCodec} from './custom/SqlErrorCodec';
import {SqlError} from '../sql/SqlError';

// hex: 0x210400
const REQUEST_MESSAGE_TYPE = 2163712;
// hex: 0x210401
// RESPONSE_MESSAGE_TYPE = 2163713

const REQUEST_TIMEOUT_MILLIS_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_CURSOR_BUFFER_SIZE_OFFSET = REQUEST_TIMEOUT_MILLIS_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_EXPECTED_RESULT_TYPE_OFFSET = REQUEST_CURSOR_BUFFER_SIZE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_SKIP_UPDATE_STATISTICS_OFFSET = REQUEST_EXPECTED_RESULT_TYPE_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_SKIP_UPDATE_STATISTICS_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_UPDATE_COUNT_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

/** @internal */
export interface SqlExecuteResponseParams {
    rowMetadata: SqlColumnMetadataImpl[];
    rowPage: SqlPage;
    updateCount: Long;
    error: SqlError;
}

/** @internal */
export class SqlExecuteCodec {
    static encodeRequest(sql: string, parameters: Data[], timeoutMillis: Long, cursorBufferSize: number, schema: string, expectedResultType: number, queryId: SqlQueryId, skipUpdateStatistics: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_TIMEOUT_MILLIS_OFFSET, timeoutMillis);
        FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_CURSOR_BUFFER_SIZE_OFFSET, cursorBufferSize);
        FixSizedTypesCodec.encodeByte(initialFrame.content, REQUEST_EXPECTED_RESULT_TYPE_OFFSET, expectedResultType);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_SKIP_UPDATE_STATISTICS_OFFSET, skipUpdateStatistics);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, sql);
        ListMultiFrameCodec.encodeContainsNullable(clientMessage, parameters, DataCodec.encode);
        CodecUtil.encodeNullable(clientMessage, schema, StringCodec.encode);
        SqlQueryIdCodec.encode(clientMessage, queryId);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): SqlExecuteResponseParams {
        const initialFrame = clientMessage.nextFrame();

        const response = {} as SqlExecuteResponseParams;
        response.updateCount = FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_UPDATE_COUNT_OFFSET);
        response.rowMetadata = ListMultiFrameCodec.decodeNullable(clientMessage, SqlColumnMetadataCodec.decode);
        response.rowPage = CodecUtil.decodeNullable(clientMessage, SqlPageCodec.decode);
        response.error = CodecUtil.decodeNullable(clientMessage, SqlErrorCodec.decode);

        return response;
    }
}
