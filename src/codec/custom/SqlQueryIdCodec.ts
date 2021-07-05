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
import {SqlQueryId} from '../../sql/SqlQueryId';

const MEMBER_ID_HIGH_OFFSET = 0;
const MEMBER_ID_LOW_OFFSET = MEMBER_ID_HIGH_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const LOCAL_ID_HIGH_OFFSET = MEMBER_ID_LOW_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const LOCAL_ID_LOW_OFFSET = LOCAL_ID_HIGH_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = LOCAL_ID_LOW_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

/** @internal */
export class SqlQueryIdCodec {
    static encode(clientMessage: ClientMessage, sqlQueryId: SqlQueryId): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeLong(initialFrame.content, MEMBER_ID_HIGH_OFFSET, sqlQueryId.memberIdHigh);
        FixSizedTypesCodec.encodeLong(initialFrame.content, MEMBER_ID_LOW_OFFSET, sqlQueryId.memberIdLow);
        FixSizedTypesCodec.encodeLong(initialFrame.content, LOCAL_ID_HIGH_OFFSET, sqlQueryId.localIdHigh);
        FixSizedTypesCodec.encodeLong(initialFrame.content, LOCAL_ID_LOW_OFFSET, sqlQueryId.localIdLow);
        clientMessage.addFrame(initialFrame);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): SqlQueryId {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const memberIdHigh = FixSizedTypesCodec.decodeLong(initialFrame.content, MEMBER_ID_HIGH_OFFSET);
        const memberIdLow = FixSizedTypesCodec.decodeLong(initialFrame.content, MEMBER_ID_LOW_OFFSET);
        const localIdHigh = FixSizedTypesCodec.decodeLong(initialFrame.content, LOCAL_ID_HIGH_OFFSET);
        const localIdLow = FixSizedTypesCodec.decodeLong(initialFrame.content, LOCAL_ID_LOW_OFFSET);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new SqlQueryId(memberIdHigh, memberIdLow, localIdHigh, localIdLow);
    }
}
