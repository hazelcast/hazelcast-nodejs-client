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

/* eslint-disable max-len */
import {ClientMessage, BEGIN_FRAME, END_FRAME} from '../../protocol/ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {StringCodec} from '../builtin/StringCodec';
import {Schema} from '../../serialization/compact/Schema';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {FieldDescriptorCodec} from './FieldDescriptorCodec';

/** @internal */
export class SchemaCodec {
    static encode(clientMessage: ClientMessage, schema: Schema): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        StringCodec.encode(clientMessage, schema.typeName);
        ListMultiFrameCodec.encode(clientMessage, schema.fields, FieldDescriptorCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): Schema {
        // begin frame
        clientMessage.nextFrame();

        const typeName = StringCodec.decode(clientMessage);
        const fields = ListMultiFrameCodec.decode(clientMessage, FieldDescriptorCodec.decode);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new Schema(typeName, fields);
    }
}
