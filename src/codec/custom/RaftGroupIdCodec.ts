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
import {RaftGroupId} from '../../proxy/cpsubsystem/RaftGroupId';
import {StringCodec} from '../builtin/StringCodec';

const SEED_OFFSET = 0;
const ID_OFFSET = SEED_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = ID_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

/** @internal */
export class RaftGroupIdCodec {
    static encode(clientMessage: ClientMessage, raftGroupId: RaftGroupId): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeLong(initialFrame.content, SEED_OFFSET, raftGroupId.seed);
        FixSizedTypesCodec.encodeLong(initialFrame.content, ID_OFFSET, raftGroupId.id);
        clientMessage.addFrame(initialFrame);

        StringCodec.encode(clientMessage, raftGroupId.name);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): RaftGroupId {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const seed = FixSizedTypesCodec.decodeLong(initialFrame.content, SEED_OFFSET);
        const id = FixSizedTypesCodec.decodeLong(initialFrame.content, ID_OFFSET);

        const name = StringCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new RaftGroupId(name, seed, id);
    }
}
