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

import {ClientMessage} from '../../protocol/ClientMessage';
import {SqlPage} from '../../sql/SqlPage';
import {ListIntegerCodec} from './ListIntegerCodec';
import {SqlColumnType} from '../../sql/SqlColumnMetadata';
import {ListMultiFrameCodec} from './ListMultiFrameCodec';
import {StringCodec} from './StringCodec';
import {ListCNBooleanCodec} from './ListCNBooleanCodec';
import {ListCNByteCodec} from './ListCNByteCodec';
import {ListCNShortCodec} from './ListCNShortCodec';
import {ListCNIntegerCodec} from './ListCNIntegerCodec';
import {ListCNLongCodec} from './ListCNLongCodec';
import {ListCNFloatCodec} from './ListCNFloatCodec';
import {ListCNDoubleCodec} from './ListCNDoubleCodec';
import {ListCNLocalDateCodec} from './ListCNLocalDateCodec';
import {ListCNLocalTimeCodec} from './ListCNLocalTimeCodec';
import {ListCNLocalDateTimeCodec} from './ListCNLocalDateTimeCodec';
import {ListCNOffsetDateTimeCodec} from './ListCNOffsetDateTimeCodec';
import {BigDecimalCodec} from './BigDecimalCodec';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';
import {DataCodec} from './DataCodec';
import {IllegalStateError} from '../../core';
import {CodecUtil} from './CodecUtil';

/** @internal */
export class SqlPageCodec {
    static decode(clientMessage: ClientMessage): SqlPage {
        // begin frame
        clientMessage.nextFrame();

        // Read the "last" flag.
        const isLast = clientMessage.nextFrame().content[0] === 1;

        // Read column types.
        const columnTypeIds: number[] = ListIntegerCodec.decode(clientMessage);
        const columnTypes: SqlColumnType[] = new Array<SqlColumnType>(columnTypeIds.length);

        // Read columns
        const columns: any[][] = new Array(columnTypeIds.length);

        for (const [i, columnTypeId] of columnTypeIds.entries()) {
            const columnType: SqlColumnType = columnTypeId;

            columnTypes[i] = columnType;

            switch (columnType) {
                case SqlColumnType.VARCHAR:
                    columns[i] = ListMultiFrameCodec.decodeContainsNullable(clientMessage, StringCodec.decode);
                    break;
                case SqlColumnType.BOOLEAN:
                    columns[i] = ListCNBooleanCodec.decode(clientMessage);
                    break;
                case SqlColumnType.TINYINT:
                    columns[i] = ListCNByteCodec.decode(clientMessage);
                    break;
                case SqlColumnType.SMALLINT:
                    columns[i] = ListCNShortCodec.decode(clientMessage);
                    break;
                case SqlColumnType.INTEGER:
                    columns[i] = ListCNIntegerCodec.decode(clientMessage);
                    break;
                case SqlColumnType.BIGINT:
                    columns[i] = ListCNLongCodec.decode(clientMessage);
                    break;
                case SqlColumnType.REAL:
                    columns[i] = ListCNFloatCodec.decode(clientMessage);
                    break;
                case SqlColumnType.DOUBLE:
                    columns[i] = ListCNDoubleCodec.decode(clientMessage);
                    break;
                case SqlColumnType.DATE:
                    columns[i] = ListCNLocalDateCodec.decode(clientMessage);
                    break;
                case SqlColumnType.TIME:
                    columns[i] = ListCNLocalTimeCodec.decode(clientMessage);
                    break;
                case SqlColumnType.TIMESTAMP:
                    columns[i] = ListCNLocalDateTimeCodec.decode(clientMessage);
                    break;
                case SqlColumnType.TIMESTAMP_WITH_TIME_ZONE:
                    columns[i] = ListCNOffsetDateTimeCodec.decode(clientMessage);
                    break;
                case SqlColumnType.DECIMAL:
                    columns[i] = ListMultiFrameCodec.decode(clientMessage, BigDecimalCodec.decodeNullable);
                    break;
                case SqlColumnType.NULL: {
                    const frame = clientMessage.nextFrame();
                    const size = FixSizedTypesCodec.decodeInt(frame.content, 0);

                    const column = new Array(size);
                    for (let i = 0; i < size; i++) {
                        column[i] = null;
                    }
                    columns[i] = (column);
                    break;
                }
                case SqlColumnType.OBJECT:
                    columns[i] = ListMultiFrameCodec.decode(clientMessage, DataCodec.decodeNullable);
                    break;
                default:
                    throw new IllegalStateError('Unknown type ' + columnType);

            }
        }
        CodecUtil.fastForwardToEndFrame(clientMessage);

        return SqlPage.fromColumns(columnTypes, columns, isLast);
    }

}
