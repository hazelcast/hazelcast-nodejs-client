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
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, Frame, DEFAULT_FLAGS} from '../../protocol/ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {FieldDescriptor} from '../../serialization/generic_record/FieldDescriptor';
import {StringCodec} from '../builtin/StringCodec';

const KIND_OFFSET = 0;
const INITIAL_FRAME_SIZE = KIND_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class FieldDescriptorCodec {
    static encode(clientMessage: ClientMessage, fieldDescriptor: FieldDescriptor): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeInt(initialFrame.content, KIND_OFFSET, fieldDescriptor.kind);
        clientMessage.addFrame(initialFrame);

        StringCodec.encode(clientMessage, fieldDescriptor.fieldName);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): FieldDescriptor {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const kind = FixSizedTypesCodec.decodeInt(initialFrame.content, KIND_OFFSET);

        const fieldName = StringCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new FieldDescriptor(fieldName, kind);
    }
}
