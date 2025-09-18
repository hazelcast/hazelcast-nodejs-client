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
exports.SqlColumnMetadataCodec = void 0;
/* eslint-disable max-len */
const FixSizedTypesCodec_1 = require("../builtin/FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const SqlColumnMetadata_1 = require("../../sql/SqlColumnMetadata");
const StringCodec_1 = require("../builtin/StringCodec");
const TYPE_OFFSET = 0;
const NULLABLE_OFFSET = TYPE_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = NULLABLE_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES;
/** @internal */
class SqlColumnMetadataCodec {
    static encode(clientMessage, sqlColumnMetadata) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(INITIAL_FRAME_SIZE, ClientMessage_1.DEFAULT_FLAGS);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(initialFrame.content, TYPE_OFFSET, sqlColumnMetadata.type);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeBoolean(initialFrame.content, NULLABLE_OFFSET, sqlColumnMetadata.nullable);
        clientMessage.addFrame(initialFrame);
        StringCodec_1.StringCodec.encode(clientMessage, sqlColumnMetadata.name);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const initialFrame = clientMessage.nextFrame();
        const type = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(initialFrame.content, TYPE_OFFSET);
        let isNullableExists = false;
        let nullable = false;
        if (initialFrame.content.length >= NULLABLE_OFFSET + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES) {
            nullable = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeBoolean(initialFrame.content, NULLABLE_OFFSET);
            isNullableExists = true;
        }
        const name = StringCodec_1.StringCodec.decode(clientMessage);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new SqlColumnMetadata_1.SqlColumnMetadataImpl(name, type, isNullableExists, nullable);
    }
}
exports.SqlColumnMetadataCodec = SqlColumnMetadataCodec;
//# sourceMappingURL=SqlColumnMetadataCodec.js.map