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

/* eslint-disable max-len */
import {ClientMessage, BEGIN_FRAME, END_FRAME} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {StringCodec} from '../builtin/StringCodec';
import {DistributedObjectInfo} from '../../DistributedObjectInfo';

export class DistributedObjectInfoCodec {
    static encode(clientMessage: ClientMessage, distributedObjectInfo: DistributedObjectInfo): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        StringCodec.encode(clientMessage, distributedObjectInfo.serviceName);
        StringCodec.encode(clientMessage, distributedObjectInfo.name);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): DistributedObjectInfo {
        // begin frame
        clientMessage.nextFrame();
        const serviceName: string = StringCodec.decode(clientMessage);
        const name: string = StringCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new DistributedObjectInfo(serviceName, name);
    }
}
