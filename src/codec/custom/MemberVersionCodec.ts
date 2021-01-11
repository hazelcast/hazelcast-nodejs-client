/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
import {MemberVersion} from '../../core/MemberVersion';

const MAJOR_OFFSET = 0;
const MINOR_OFFSET = MAJOR_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const PATCH_OFFSET = MINOR_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = PATCH_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

/** @internal */
export class MemberVersionCodec {
    static encode(clientMessage: ClientMessage, memberVersion: MemberVersion): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeByte(initialFrame.content, MAJOR_OFFSET, memberVersion.major);
        FixSizedTypesCodec.encodeByte(initialFrame.content, MINOR_OFFSET, memberVersion.minor);
        FixSizedTypesCodec.encodeByte(initialFrame.content, PATCH_OFFSET, memberVersion.patch);
        clientMessage.addFrame(initialFrame);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): MemberVersion {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const major = FixSizedTypesCodec.decodeByte(initialFrame.content, MAJOR_OFFSET);
        const minor = FixSizedTypesCodec.decodeByte(initialFrame.content, MINOR_OFFSET);
        const patch = FixSizedTypesCodec.decodeByte(initialFrame.content, PATCH_OFFSET);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new MemberVersion(major, minor, patch);
    }
}
