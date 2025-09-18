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
exports.PagingPredicateHolderCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const PagingPredicateHolder_1 = require("../../protocol/PagingPredicateHolder");
const AnchorDataListHolderCodec_1 = require("./AnchorDataListHolderCodec");
const DataCodec_1 = require("../builtin/DataCodec");
const PAGE_SIZE_OFFSET = 0;
const PAGE_OFFSET = PAGE_SIZE_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const ITERATION_TYPE_ID_OFFSET = PAGE_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = ITERATION_TYPE_ID_OFFSET + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
/** @internal */
class PagingPredicateHolderCodec {
    static encode(clientMessage, pagingPredicateHolder) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, PAGE_SIZE_OFFSET, pagingPredicateHolder.pageSize);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, PAGE_OFFSET, pagingPredicateHolder.page);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeByte(initialFrame.content, ITERATION_TYPE_ID_OFFSET, pagingPredicateHolder.iterationTypeId);
        clientMessage.addFrame(initialFrame);
        AnchorDataListHolderCodec_1.AnchorDataListHolderCodec.encode(clientMessage, pagingPredicateHolder.anchorDataListHolder);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.predicateData, DataCodec_1.DataCodec.encode);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.comparatorData, DataCodec_1.DataCodec.encode);
        CodecUtil_1.CodecUtil.encodeNullable(clientMessage, pagingPredicateHolder.partitionKeyData, DataCodec_1.DataCodec.encode);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const pageSize = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, PAGE_SIZE_OFFSET);
        const page = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, PAGE_OFFSET);
        const iterationTypeId = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte(initialFrame.content, ITERATION_TYPE_ID_OFFSET);
        const anchorDataListHolder = AnchorDataListHolderCodec_1.AnchorDataListHolderCodec.decode(clientMessage);
        const predicateData = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
        const comparatorData = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
        const partitionKeyData = CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new PagingPredicateHolder_1.PagingPredicateHolder(anchorDataListHolder, predicateData, comparatorData, pageSize, page, iterationTypeId, partitionKeyData);
    }
}
exports.PagingPredicateHolderCodec = PagingPredicateHolderCodec;
//# sourceMappingURL=PagingPredicateHolderCodec.js.map