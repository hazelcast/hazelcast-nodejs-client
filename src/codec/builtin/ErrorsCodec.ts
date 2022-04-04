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

// Other codecs message types can be in range 0x000100 - 0xFFFFFF
// So, it is safe to supply a custom message type for exceptions in
// the range 0x000000 - 0x0000FF
import {ClientMessage} from '../../protocol/ClientMessage';
import {ErrorHolder} from '../../protocol/ErrorHolder';
import {ListMultiFrameCodec} from './ListMultiFrameCodec';
import {ErrorHolderCodec} from '../custom/ErrorHolderCodec';

export const EXCEPTION_MESSAGE_TYPE = 0;

/** @internal */
export class ErrorsCodec {
    static decode(clientMessage: ClientMessage): ErrorHolder[] {
        // initial frame
        clientMessage.nextFrame();
        return ListMultiFrameCodec.decode(clientMessage, ErrorHolderCodec.decode);
    }
}
