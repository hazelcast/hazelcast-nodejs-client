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
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, ForwardFrameIterator, Frame} from '../../ClientMessage';
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
        clientMessage.add(BEGIN_FRAME.copy());

        const initialFrame = new Frame(Buffer.allocUnsafe(INITIAL_FRAME_SIZE));
        FixSizedTypesCodec.encodeInt(initialFrame.content, PAGE_SIZE_OFFSET, pagingPredicateHolder.pageSize);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PAGE_OFFSET, pagingPredicateHolder.page);
        FixSizedTypesCodec.encodeByte(initialFrame.content, ITERATION_TYPE_ID_OFFSET, pagingPredicateHolder.iterationTypeId);
        clientMessage.add(initialFrame);

        AnchorDataListHolderCodec.encode(clientMessage, pagingPredicateHolder.anchorDataListHolder);
        CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.predicateData, DataCodec.encode);
        CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.comparatorData, DataCodec.encode);
        CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.partitionKeyData, DataCodec.encode);

        clientMessage.add(END_FRAME.copy());
    }

    static decode(iterator: ForwardFrameIterator): PagingPredicateHolder {
        // begin frame
        iterator.getNextFrame();

        const initialFrame = iterator.getNextFrame();
        const pageSize: number = FixSizedTypesCodec.decodeInt(initialFrame.content, PAGE_SIZE_OFFSET);
        const page: number = FixSizedTypesCodec.decodeInt(initialFrame.content, PAGE_OFFSET);
        const iterationTypeId: number = FixSizedTypesCodec.decodeByte(initialFrame.content, ITERATION_TYPE_ID_OFFSET);
        const anchorDataListHolder: AnchorDataListHolder = AnchorDataListHolderCodec.decode(iterator);
        const predicateData: Data = CodecUtil.decodeNullable(iterator, DataCodec.decode);
        const comparatorData: Data = CodecUtil.decodeNullable(iterator, DataCodec.decode);
        const partitionKeyData: Data = CodecUtil.decodeNullable(iterator, DataCodec.decode);

        CodecUtil.fastForwardToEndFrame(iterator);

        return new PagingPredicateHolder(anchorDataListHolder, predicateData, comparatorData, pageSize, page, iterationTypeId, partitionKeyData);
    }
}
