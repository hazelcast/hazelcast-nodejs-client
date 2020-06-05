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
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, Frame} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {AnchorDataListHolder} from '../../protocol/AnchorDataListHolder';
import {AnchorDataListHolderCodec} from './AnchorDataListHolderCodec';
import {Data} from '../../serialization/Data';
import {DataCodec} from '../builtin/DataCodec';
import {PagingPredicateHolder} from '../../protocol/PagingPredicateHolder';

const PAGE_SIZE_OFFSET = 0;
const PAGE_OFFSET = PAGE_SIZE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const ITERATION_TYPE_ID_OFFSET = PAGE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = ITERATION_TYPE_ID_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

export class PagingPredicateHolderCodec {
    static encode(clientMessage: ClientMessage, pagingPredicateHolder: PagingPredicateHolder): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PAGE_SIZE_OFFSET, pagingPredicateHolder.pageSize);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PAGE_OFFSET, pagingPredicateHolder.page);
        FixSizedTypesCodec.encodeByte(initialFrame.content, ITERATION_TYPE_ID_OFFSET, pagingPredicateHolder.iterationTypeId);
        clientMessage.addFrame(initialFrame);

        AnchorDataListHolderCodec.encode(clientMessage, pagingPredicateHolder.anchorDataListHolder);
        CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.predicateData, DataCodec.encode);
        CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.comparatorData, DataCodec.encode);
        CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.partitionKeyData, DataCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): PagingPredicateHolder {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const pageSize: number = FixSizedTypesCodec.decodeInt(initialFrame.content, PAGE_SIZE_OFFSET);
        const page: number = FixSizedTypesCodec.decodeInt(initialFrame.content, PAGE_OFFSET);
        const iterationTypeId: number = FixSizedTypesCodec.decodeByte(initialFrame.content, ITERATION_TYPE_ID_OFFSET);
        const anchorDataListHolder: AnchorDataListHolder = AnchorDataListHolderCodec.decode(clientMessage);
        const predicateData: Data = CodecUtil.decodeNullable(clientMessage, DataCodec.decode);
        const comparatorData: Data = CodecUtil.decodeNullable(clientMessage, DataCodec.decode);
        const partitionKeyData: Data = CodecUtil.decodeNullable(clientMessage, DataCodec.decode);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new PagingPredicateHolder(anchorDataListHolder, predicateData, comparatorData, pageSize, page, iterationTypeId, partitionKeyData);
    }
}
