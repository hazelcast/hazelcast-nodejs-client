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
import {UUID} from '../../core/UUID';
import {Address} from '../../Address';
import {AddressCodec} from './AddressCodec';
import {MapCodec} from '../builtin/MapCodec';
import {StringCodec} from '../builtin/StringCodec';
import {MemberVersion} from '../../core/MemberVersion';
import {MemberVersionCodec} from './MemberVersionCodec';
import {MemberInfo} from '../../core/MemberInfo';

const UUID_OFFSET = 0;
const LITE_MEMBER_OFFSET = UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = LITE_MEMBER_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;

export class MemberInfoCodec {
    static encode(clientMessage: ClientMessage, memberInfo: MemberInfo): void {
        clientMessage.add(BEGIN_FRAME.copy());

        const initialFrame = new Frame(Buffer.allocUnsafe(INITIAL_FRAME_SIZE));
        FixSizedTypesCodec.encodeUUID(initialFrame.content, UUID_OFFSET, memberInfo.uuid);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, LITE_MEMBER_OFFSET, memberInfo.liteMember);
        clientMessage.add(initialFrame);

        AddressCodec.encode(clientMessage, memberInfo.address);
        MapCodec.encode(clientMessage, memberInfo.attributes, StringCodec.encode, StringCodec.encode);
        MemberVersionCodec.encode(clientMessage, memberInfo.version);

        clientMessage.add(END_FRAME.copy());
    }

    static decode(iterator: ForwardFrameIterator): MemberInfo {
        // begin frame
        iterator.getNextFrame();

        const initialFrame = iterator.getNextFrame();
        const uuid: UUID = FixSizedTypesCodec.decodeUUID(initialFrame.content, UUID_OFFSET);
        const liteMember: boolean = FixSizedTypesCodec.decodeBoolean(initialFrame.content, LITE_MEMBER_OFFSET);
        const address: Address = AddressCodec.decode(iterator);
        const attributes: Map<string, string> = MapCodec.decode(iterator, StringCodec.decode, StringCodec.decode);
        const version: MemberVersion = MemberVersionCodec.decode(iterator);

        CodecUtil.fastForwardToEndFrame(iterator);

        return new MemberInfo(address, uuid, attributes, liteMember, version);
    }
}
