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
exports.DataCodec = void 0;
const ClientMessage_1 = require("../../protocol/ClientMessage");
const HeapData_1 = require("../../serialization/HeapData");
const CodecUtil_1 = require("./CodecUtil");
/** @internal */
class DataCodec {
    static encode(clientMessage, data) {
        clientMessage.addFrame(new ClientMessage_1.Frame(data.toBuffer()));
    }
    static encodeNullable(clientMessage, data) {
        if (data === null) {
            clientMessage.addFrame(ClientMessage_1.NULL_FRAME.copy());
        }
        else {
            clientMessage.addFrame(new ClientMessage_1.Frame(data.toBuffer()));
        }
    }
    static decode(clientMessage) {
        return new HeapData_1.HeapData(clientMessage.nextFrame().content);
    }
    static decodeNullable(clientMessage) {
        return CodecUtil_1.CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : DataCodec.decode(clientMessage);
    }
}
exports.DataCodec = DataCodec;
//# sourceMappingURL=DataCodec.js.map