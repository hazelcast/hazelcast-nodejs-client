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
exports.ErrorsCodec = exports.EXCEPTION_MESSAGE_TYPE = void 0;
const ListMultiFrameCodec_1 = require("./ListMultiFrameCodec");
const ErrorHolderCodec_1 = require("../custom/ErrorHolderCodec");
exports.EXCEPTION_MESSAGE_TYPE = 0;
/** @internal */
class ErrorsCodec {
    static decode(clientMessage) {
        // initial frame
        clientMessage.nextFrame();
        return ListMultiFrameCodec_1.ListMultiFrameCodec.decode(clientMessage, ErrorHolderCodec_1.ErrorHolderCodec.decode);
    }
}
exports.ErrorsCodec = ErrorsCodec;
//# sourceMappingURL=ErrorsCodec.js.map