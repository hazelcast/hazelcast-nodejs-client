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
exports.AnchorDataListHolderCodec = void 0;
/* eslint-disable max-len */
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const ListIntegerCodec_1 = require("../builtin/ListIntegerCodec");
const AnchorDataListHolder_1 = require("../../protocol/AnchorDataListHolder");
const EntryListCodec_1 = require("../builtin/EntryListCodec");
const DataCodec_1 = require("../builtin/DataCodec");
/** @internal */
class AnchorDataListHolderCodec {
    static encode(clientMessage, anchorDataListHolder) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        ListIntegerCodec_1.ListIntegerCodec.encode(clientMessage, anchorDataListHolder.anchorPageList);
        EntryListCodec_1.EntryListCodec.encode(clientMessage, anchorDataListHolder.anchorDataList, DataCodec_1.DataCodec.encode, DataCodec_1.DataCodec.encode);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const anchorPageList = ListIntegerCodec_1.ListIntegerCodec.decode(clientMessage);
        const anchorDataList = EntryListCodec_1.EntryListCodec.decode(clientMessage, DataCodec_1.DataCodec.decode, DataCodec_1.DataCodec.decode);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new AnchorDataListHolder_1.AnchorDataListHolder(anchorPageList, anchorDataList);
    }
}
exports.AnchorDataListHolderCodec = AnchorDataListHolderCodec;
//# sourceMappingURL=AnchorDataListHolderCodec.js.map