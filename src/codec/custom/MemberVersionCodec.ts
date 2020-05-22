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

/*tslint:disable:max-line-length*/
import {Buffer} from 'safe-buffer';
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, ForwardFrameIterator, Frame} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {MemberVersion} from '../../core/MemberVersion';

const MAJOR_OFFSET = 0;
const MINOR_OFFSET = MAJOR_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const PATCH_OFFSET = MINOR_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = PATCH_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

export class MemberVersionCodec {
    static encode(clientMessage: ClientMessage, memberVersion: MemberVersion): void {
        clientMessage.add(BEGIN_FRAME.copy());

        const initialFrame = new Frame(Buffer.allocUnsafe(INITIAL_FRAME_SIZE));
        FixSizedTypesCodec.encodeByte(initialFrame.content, MAJOR_OFFSET, memberVersion.major);
        FixSizedTypesCodec.encodeByte(initialFrame.content, MINOR_OFFSET, memberVersion.minor);
        FixSizedTypesCodec.encodeByte(initialFrame.content, PATCH_OFFSET, memberVersion.patch);
        clientMessage.add(initialFrame);

        clientMessage.add(END_FRAME.copy());
    }

    static decode(iterator: ForwardFrameIterator): MemberVersion {
        // begin frame
        iterator.getNextFrame();

        const initialFrame = iterator.getNextFrame();
        const major: number = FixSizedTypesCodec.decodeByte(initialFrame.content, MAJOR_OFFSET);
        const minor: number = FixSizedTypesCodec.decodeByte(initialFrame.content, MINOR_OFFSET);
        const patch: number = FixSizedTypesCodec.decodeByte(initialFrame.content, PATCH_OFFSET);

        CodecUtil.fastForwardToEndFrame(iterator);

        return new MemberVersion(major, minor, patch);
    }
}
