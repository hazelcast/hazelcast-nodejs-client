"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlExecuteCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const ListMultiFrameCodec_1 = require("./builtin/ListMultiFrameCodec");
const DataCodec_1 = require("./builtin/DataCodec");
const CodecUtil_1 = require("./builtin/CodecUtil");
const SqlQueryIdCodec_1 = require("./custom/SqlQueryIdCodec");
const SqlColumnMetadataCodec_1 = require("./custom/SqlColumnMetadataCodec");
const SqlPageCodec_1 = require("./builtin/SqlPageCodec");
const SqlErrorCodec_1 = require("./custom/SqlErrorCodec");
// hex: 0x210400
const REQUEST_MESSAGE_TYPE = 2163712;
// hex: 0x210401
// RESPONSE_MESSAGE_TYPE = 2163713
const REQUEST_TIMEOUT_MILLIS_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_CURSOR_BUFFER_SIZE_OFFSET = REQUEST_TIMEOUT_MILLIS_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_EXPECTED_RESULT_TYPE_OFFSET = REQUEST_CURSOR_BUFFER_SIZE_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_SKIP_UPDATE_STATISTICS_OFFSET = REQUEST_EXPECTED_RESULT_TYPE_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_SKIP_UPDATE_STATISTICS_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES;
const RESPONSE_UPDATE_COUNT_OFFSET = ClientMessage_1.RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
const RESPONSE_IS_INFINITE_ROWS_OFFSET = RESPONSE_UPDATE_COUNT_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class SqlExecuteCodec {
    static encodeRequest(sql, parameters, timeoutMillis, cursorBufferSize, schema, expectedResultType, queryId, skipUpdateStatistics) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setContainsSerializedDataInRequest(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_TIMEOUT_MILLIS_OFFSET, timeoutMillis);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, REQUEST_CURSOR_BUFFER_SIZE_OFFSET, cursorBufferSize);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeByte(initialFrame.content, REQUEST_EXPECTED_RESULT_TYPE_OFFSET, expectedResultType);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeBoolean(initialFrame.content, REQUEST_SKIP_UPDATE_STATISTICS_OFFSET, skipUpdateStatistics);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, sql);
        ListMultiFrameCodec_1.ListMultiFrameCodec.encodeContainsNullable(clientMessage, parameters, DataCodec_1.DataCodec.encode);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, schema, StringCodec_1.StringCodec.encode);
        SqlQueryIdCodec_1.SqlQueryIdCodec.encode(clientMessage, queryId);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        const initialFrame = clientMessage.nextFrame();
        const response = {};
        response.updateCount = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(initialFrame.content, RESPONSE_UPDATE_COUNT_OFFSET);
        if (initialFrame.content.length >= RESPONSE_IS_INFINITE_ROWS_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES) {
            response.isInfiniteRows = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeBoolean(initialFrame.content, RESPONSE_IS_INFINITE_ROWS_OFFSET);
            response.isIsInfiniteRowsExists = true;
        }
        else {
            response.isIsInfiniteRowsExists = false;
        }
        response.rowMetadata = ListMultiFrameCodec_1.ListMultiFrameCodec.decodeNullable(clientMessage, SqlColumnMetadataCodec_1.SqlColumnMetadataCodec.decode);
        response.rowPage = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, SqlPageCodec_1.SqlPageCodec.decode);
        response.error = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, SqlErrorCodec_1.SqlErrorCodec.decode);
        return response;
    }
}
exports.SqlExecuteCodec = SqlExecuteCodec;
//# sourceMappingURL=SqlExecuteCodec.js.map