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
import {SqlError} from '../../sql/SqlError';
import {StringCodec} from '../builtin/StringCodec';

const CODE_OFFSET = 0;
const ORIGINATING_MEMBER_ID_OFFSET = CODE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = ORIGINATING_MEMBER_ID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;

/** @internal */
export class SqlErrorCodec {
    static encode(clientMessage: ClientMessage, sqlError: SqlError): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeInt(initialFrame.content, CODE_OFFSET, sqlError.code);
        FixSizedTypesCodec.encodeUUID(initialFrame.content, ORIGINATING_MEMBER_ID_OFFSET, sqlError.originatingMemberId);
        clientMessage.addFrame(initialFrame);

        CodecUtil.encodeNullable(clientMessage, sqlError.message, StringCodec.encode);
        CodecUtil.encodeNullable(clientMessage, sqlError.suggestion, StringCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): SqlError {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const code = FixSizedTypesCodec.decodeInt(initialFrame.content, CODE_OFFSET);
        const originatingMemberId = FixSizedTypesCodec.decodeUUID(initialFrame.content, ORIGINATING_MEMBER_ID_OFFSET);

        const message = CodecUtil.decodeNullable(clientMessage, StringCodec.decode);
        let isSuggestionExists = false;
        let suggestion = null;
        if (!clientMessage.peekNextFrame().isEndFrame()) {
            suggestion = CodecUtil.decodeNullable(clientMessage, StringCodec.decode);
            isSuggestionExists = true;
        }

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new SqlError(code, message, originatingMemberId, isSuggestionExists, suggestion);
    }
}
