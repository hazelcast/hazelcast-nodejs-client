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
exports.SchemaCodec = void 0;
/* eslint-disable max-len */
const ClientMessage_1 = require("../../protocol/ClientMessage");
const CodecUtil_1 = require("../builtin/CodecUtil");
const StringCodec_1 = require("../builtin/StringCodec");
const Schema_1 = require("../../serialization/compact/Schema");
const ListMultiFrameCodec_1 = require("../builtin/ListMultiFrameCodec");
const FieldDescriptorCodec_1 = require("./FieldDescriptorCodec");
/** @internal */
class SchemaCodec {
    static encode(clientMessage, schema) {
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        StringCodec_1.StringCodec.encode(clientMessage, schema.typeName);
        ListMultiFrameCodec_1.ListMultiFrameCodec.encode(clientMessage, schema.fields, FieldDescriptorCodec_1.FieldDescriptorCodec.encode);
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
    }
    static decode(clientMessage) {
        // begin frame
        clientMessage.nextFrame();
        const typeName = StringCodec_1.StringCodec.decode(clientMessage);
        const fields = ListMultiFrameCodec_1.ListMultiFrameCodec.decode(clientMessage, FieldDescriptorCodec_1.FieldDescriptorCodec.decode);
        CodecUtil_1.CodecUtil.fastForwardToEndFrame(clientMessage);
        return new Schema_1.Schema(typeName, fields);
    }
}
exports.SchemaCodec = SchemaCodec;
//# sourceMappingURL=SchemaCodec.js.map