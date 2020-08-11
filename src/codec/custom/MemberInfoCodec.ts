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
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, Frame, DEFAULT_FLAGS} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {MemberInfo} from '../../core/MemberInfo';
import {AddressCodec} from './AddressCodec';
import {MapCodec} from '../builtin/MapCodec';
import {StringCodec} from '../builtin/StringCodec';
import {MemberVersionCodec} from './MemberVersionCodec';

const UUID_OFFSET = 0;
const LITE_MEMBER_OFFSET = UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = LITE_MEMBER_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;

/** @internal */
export class MemberInfoCodec {
    static encode(clientMessage: ClientMessage, memberInfo: MemberInfo): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeUUID(initialFrame.content, UUID_OFFSET, memberInfo.uuid);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, LITE_MEMBER_OFFSET, memberInfo.liteMember);
        clientMessage.addFrame(initialFrame);

        AddressCodec.encode(clientMessage, memberInfo.address);
        MapCodec.encode(clientMessage, memberInfo.attributes, StringCodec.encode, StringCodec.encode);
        MemberVersionCodec.encode(clientMessage, memberInfo.version);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): MemberInfo {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const uuid = FixSizedTypesCodec.decodeUUID(initialFrame.content, UUID_OFFSET);
        const liteMember = FixSizedTypesCodec.decodeBoolean(initialFrame.content, LITE_MEMBER_OFFSET);

        const address = AddressCodec.decode(clientMessage);
        const attributes = MapCodec.decode(clientMessage, StringCodec.decode, StringCodec.decode);
        const version = MemberVersionCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new MemberInfo(address, uuid, attributes, liteMember, version);
    }
}
