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
import {BitsUtil} from '../BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, MESSAGE_TYPE_OFFSET, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {MemberInfo} from '../core/MemberInfo';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {MemberInfoCodec} from './custom/MemberInfoCodec';
import {EntryListUUIDListIntegerCodec} from './builtin/EntryListUUIDListIntegerCodec';
import {UUID} from '../core/UUID';

// hex: 0x000300
const REQUEST_MESSAGE_TYPE = 768;
// hex: 0x000301
const RESPONSE_MESSAGE_TYPE = 769;
// hex: 0x000302
const EVENT_MEMBERS_VIEW_MESSAGE_TYPE = 770;
// hex: 0x000303
const EVENT_PARTITIONS_VIEW_MESSAGE_TYPE = 771;

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_MEMBERS_VIEW_VERSION_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const EVENT_PARTITIONS_VIEW_VERSION_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export class ClientAddClusterViewListenerCodec {
    static encodeRequest(): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, MESSAGE_TYPE_OFFSET, REQUEST_MESSAGE_TYPE);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PARTITION_ID_OFFSET, -1);
        clientMessage.addFrame(initialFrame);

        return clientMessage;
    }

    static handle(clientMessage: ClientMessage, handleMembersViewEvent: (version: number, memberInfos: MemberInfo[]) => void = null, handlePartitionsViewEvent: (version: number, partitions: Array<[UUID, number[]]>) => void = null): void {
        const messageType = clientMessage.getMessageType();
        const iterator = clientMessage.frameIterator();
        if (messageType === EVENT_MEMBERS_VIEW_MESSAGE_TYPE && handleMembersViewEvent !== null) {
            const initialFrame = iterator.getNextFrame();
            const version = FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_MEMBERS_VIEW_VERSION_OFFSET);
            const memberInfos = ListMultiFrameCodec.decode(iterator, MemberInfoCodec.decode);
            handleMembersViewEvent(version, memberInfos);
            return;
        }
        if (messageType === EVENT_PARTITIONS_VIEW_MESSAGE_TYPE && handlePartitionsViewEvent !== null) {
            const initialFrame = iterator.getNextFrame();
            const version = FixSizedTypesCodec.decodeInt(initialFrame.content, EVENT_PARTITIONS_VIEW_VERSION_OFFSET);
            const partitions = EntryListUUIDListIntegerCodec.decode(iterator);
            handlePartitionsViewEvent(version, partitions);
            return;
        }
    }
}
