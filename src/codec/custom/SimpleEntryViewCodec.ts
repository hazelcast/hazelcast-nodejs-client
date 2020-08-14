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
import {SimpleEntryView} from '../../core/SimpleEntryView';
import {Data} from '../../serialization/Data';
import {DataCodec} from '../builtin/DataCodec';

const COST_OFFSET = 0;
const CREATION_TIME_OFFSET = COST_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const EXPIRATION_TIME_OFFSET = CREATION_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const HITS_OFFSET = EXPIRATION_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const LAST_ACCESS_TIME_OFFSET = HITS_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const LAST_STORED_TIME_OFFSET = LAST_ACCESS_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const LAST_UPDATE_TIME_OFFSET = LAST_STORED_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const VERSION_OFFSET = LAST_UPDATE_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const TTL_OFFSET = VERSION_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const MAX_IDLE_OFFSET = TTL_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = MAX_IDLE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

/** @internal */
export class SimpleEntryViewCodec {
    static encode(clientMessage: ClientMessage, simpleEntryView: SimpleEntryView<Data, Data>): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeLong(initialFrame.content, COST_OFFSET, simpleEntryView.cost);
        FixSizedTypesCodec.encodeLong(initialFrame.content, CREATION_TIME_OFFSET, simpleEntryView.creationTime);
        FixSizedTypesCodec.encodeLong(initialFrame.content, EXPIRATION_TIME_OFFSET, simpleEntryView.expirationTime);
        FixSizedTypesCodec.encodeLong(initialFrame.content, HITS_OFFSET, simpleEntryView.hits);
        FixSizedTypesCodec.encodeLong(initialFrame.content, LAST_ACCESS_TIME_OFFSET, simpleEntryView.lastAccessTime);
        FixSizedTypesCodec.encodeLong(initialFrame.content, LAST_STORED_TIME_OFFSET, simpleEntryView.lastStoredTime);
        FixSizedTypesCodec.encodeLong(initialFrame.content, LAST_UPDATE_TIME_OFFSET, simpleEntryView.lastUpdateTime);
        FixSizedTypesCodec.encodeLong(initialFrame.content, VERSION_OFFSET, simpleEntryView.version);
        FixSizedTypesCodec.encodeLong(initialFrame.content, TTL_OFFSET, simpleEntryView.ttl);
        FixSizedTypesCodec.encodeLong(initialFrame.content, MAX_IDLE_OFFSET, simpleEntryView.maxIdle);
        clientMessage.addFrame(initialFrame);

        DataCodec.encode(clientMessage, simpleEntryView.key);
        DataCodec.encode(clientMessage, simpleEntryView.value);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): SimpleEntryView<Data, Data> {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const cost = FixSizedTypesCodec.decodeLong(initialFrame.content, COST_OFFSET);
        const creationTime = FixSizedTypesCodec.decodeLong(initialFrame.content, CREATION_TIME_OFFSET);
        const expirationTime = FixSizedTypesCodec.decodeLong(initialFrame.content, EXPIRATION_TIME_OFFSET);
        const hits = FixSizedTypesCodec.decodeLong(initialFrame.content, HITS_OFFSET);
        const lastAccessTime = FixSizedTypesCodec.decodeLong(initialFrame.content, LAST_ACCESS_TIME_OFFSET);
        const lastStoredTime = FixSizedTypesCodec.decodeLong(initialFrame.content, LAST_STORED_TIME_OFFSET);
        const lastUpdateTime = FixSizedTypesCodec.decodeLong(initialFrame.content, LAST_UPDATE_TIME_OFFSET);
        const version = FixSizedTypesCodec.decodeLong(initialFrame.content, VERSION_OFFSET);
        const ttl = FixSizedTypesCodec.decodeLong(initialFrame.content, TTL_OFFSET);
        const maxIdle = FixSizedTypesCodec.decodeLong(initialFrame.content, MAX_IDLE_OFFSET);

        const key = DataCodec.decode(clientMessage);
        const value = DataCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new SimpleEntryView<Data, Data>(key, value, cost, creationTime, expirationTime, hits, lastAccessTime, lastStoredTime, lastUpdateTime, version, ttl, maxIdle);
    }
}
