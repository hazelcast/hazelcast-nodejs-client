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

import {ClientMessage} from '../../protocol/ClientMessage';
import {Data} from '../../serialization/Data';
import {ListMultiFrameCodec} from './ListMultiFrameCodec';
import {DataCodec} from './DataCodec';

/** @internal */
export class ListDataCodec {
    static encode(clientMessage: ClientMessage, list: Data[]): void {
        ListMultiFrameCodec.encode(clientMessage, list, DataCodec.encode);
    }

    static decode(clientMessage: ClientMessage): Data[] {
        return ListMultiFrameCodec.decode(clientMessage, DataCodec.decode);
    }
}
