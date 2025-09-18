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
exports.SqlPageCodec = void 0;
const SqlPage_1 = require("../../sql/SqlPage");
const ListIntegerCodec_1 = require("./ListIntegerCodec");
const SqlColumnMetadata_1 = require("../../sql/SqlColumnMetadata");
const ListMultiFrameCodec_1 = require("./ListMultiFrameCodec");
const StringCodec_1 = require("./StringCodec");
const ListCNBooleanCodec_1 = require("./ListCNBooleanCodec");
const ListCNByteCodec_1 = require("./ListCNByteCodec");
const ListCNShortCodec_1 = require("./ListCNShortCodec");
const ListCNIntegerCodec_1 = require("./ListCNIntegerCodec");
const ListCNLongCodec_1 = require("./ListCNLongCodec");
const ListCNFloatCodec_1 = require("./ListCNFloatCodec");
const ListCNDoubleCodec_1 = require("./ListCNDoubleCodec");
const ListCNLocalDateCodec_1 = require("./ListCNLocalDateCodec");
const ListCNLocalTimeCodec_1 = require("./ListCNLocalTimeCodec");
const ListCNLocalDateTimeCodec_1 = require("./ListCNLocalDateTimeCodec");
const ListCNOffsetDateTimeCodec_1 = require("./ListCNOffsetDateTimeCodec");
const BigDecimalCodec_1 = require("./BigDecimalCodec");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
const DataCodec_1 = require("./DataCodec");
const core_1 = require("../../core");
const CodecUtil_1 = require("./CodecUtil");
const HazelcastJsonValueCodec_1 = require("../custom/HazelcastJsonValueCodec");
/** @internal */
class SqlPageCodec {
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        // Read the "last" flag.
        const isLast = clientMessage.nextFrame().content[0] === 1;
        // Read column types.
        const columnTypeIds = ListIntegerCodec_1.ListIntegerCodec.decode(clientMessage);
        const columnTypes = new Array(columnTypeIds.length);
        // Read columns
        const columns = new Array(columnTypeIds.length);
        for (let i = 0; i < columnTypeIds.length; i++) {
            const columnType = columnTypeIds[i];
            columnTypes[i] = columnType;
            switch (columnType) {
                case SqlColumnMetadata_1.SqlColumnType.VARCHAR:
                    columns[i] = ListMultiFrameCodec_1.ListMultiFrameCodec.decodeContainsNullable(clientMessage, StringCodec_1.StringCodec.decode);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.BOOLEAN:
                    columns[i] = ListCNBooleanCodec_1.ListCNBooleanCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.TINYINT:
                    columns[i] = ListCNByteCodec_1.ListCNByteCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.SMALLINT:
                    columns[i] = ListCNShortCodec_1.ListCNShortCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.INTEGER:
                    columns[i] = ListCNIntegerCodec_1.ListCNIntegerCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.BIGINT:
                    columns[i] = ListCNLongCodec_1.ListCNLongCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.REAL:
                    columns[i] = ListCNFloatCodec_1.ListCNFloatCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.DOUBLE:
                    columns[i] = ListCNDoubleCodec_1.ListCNDoubleCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.DATE:
                    columns[i] = ListCNLocalDateCodec_1.ListCNLocalDateCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.TIME:
                    columns[i] = ListCNLocalTimeCodec_1.ListCNLocalTimeCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.TIMESTAMP:
                    columns[i] = ListCNLocalDateTimeCodec_1.ListCNLocalDateTimeCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.TIMESTAMP_WITH_TIME_ZONE:
                    columns[i] = ListCNOffsetDateTimeCodec_1.ListCNOffsetDateTimeCodec.decode(clientMessage);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.DECIMAL:
                    columns[i] = ListMultiFrameCodec_1.ListMultiFrameCodec.decode(clientMessage, BigDecimalCodec_1.BigDecimalCodec.decodeNullable);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.NULL: {
                    const frame = clientMessage.nextFrame();
                    const size = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(frame.content, 0);
                    const column = new Array(size);
                    for (let i = 0; i < size; i++) {
                        column[i] = null;
                    }
                    columns[i] = column;
                    break;
                }
                case SqlColumnMetadata_1.SqlColumnType.OBJECT:
                    columns[i] = ListMultiFrameCodec_1.ListMultiFrameCodec.decode(clientMessage, DataCodec_1.DataCodec.decodeNullable);
                    break;
                case SqlColumnMetadata_1.SqlColumnType.JSON:
                    columns[i] = ListMultiFrameCodec_1.ListMultiFrameCodec.decodeContainsNullable(clientMessage, HazelcastJsonValueCodec_1.HazelcastJsonValueCodec.decode);
                    break;
                default:
                    throw new core_1.IllegalStateError('Unknown type ' + columnType);
            }
        }
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return SqlPage_1.SqlPage.fromColumns(columnTypes, columns, isLast);
    }
}
exports.SqlPageCodec = SqlPageCodec;
//# sourceMappingURL=SqlPageCodec.js.map