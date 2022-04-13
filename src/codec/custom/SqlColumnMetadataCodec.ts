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
import {SqlColumnMetadataImpl} from '../../sql/SqlColumnMetadata';
import {StringCodec} from '../builtin/StringCodec';

const TYPE_OFFSET = 0;
const NULLABLE_OFFSET = TYPE_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = NULLABLE_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;

/** @internal */
export class SqlColumnMetadataCodec {
    static encode(clientMessage: ClientMessage, sqlColumnMetadata: SqlColumnMetadataImpl): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeInt(initialFrame.content, TYPE_OFFSET, sqlColumnMetadata.type);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, NULLABLE_OFFSET, sqlColumnMetadata.nullable);
        clientMessage.addFrame(initialFrame);

        StringCodec.encode(clientMessage, sqlColumnMetadata.name);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): SqlColumnMetadataImpl {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const type = FixSizedTypesCodec.decodeInt(initialFrame.content, TYPE_OFFSET);
        let isNullableExists = false;
        let nullable = false;
        if (initialFrame.content.length >= NULLABLE_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES) {
            nullable = FixSizedTypesCodec.decodeBoolean(initialFrame.content, NULLABLE_OFFSET);
            isNullableExists = true;
        }

        const name = StringCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new SqlColumnMetadataImpl(name, type, isNullableExists, nullable);
    }
}
