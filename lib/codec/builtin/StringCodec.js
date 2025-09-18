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
exports.StringCodec = void 0;
const ClientMessage_1 = require("../../protocol/ClientMessage");
/** @internal */
class StringCodec {
    static encode(clientMessage, value) {
        clientMessage.addFrame(new ClientMessage_1.Frame(Buffer.from(value, 'utf8')));
    }
    static decode(clientMessage) {
        const frame = clientMessage.nextFrame();
        return frame.content.toString('utf8');
    }
}
exports.StringCodec = StringCodec;
//# sourceMappingURL=StringCodec.js.map