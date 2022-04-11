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
import {AddressImpl} from '../../core/Address';
import {StringCodec} from '../builtin/StringCodec';

const PORT_OFFSET = 0;
const INITIAL_FRAME_SIZE = PORT_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

/** @internal */
export class AddressCodec {
    static encode(clientMessage: ClientMessage, address: AddressImpl): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, DEFAULT_FLAGS);
        FixSizedTypesCodec.encodeInt(initialFrame.content, PORT_OFFSET, address.port);
        clientMessage.addFrame(initialFrame);

        StringCodec.encode(clientMessage, address.host);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): AddressImpl {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const port = FixSizedTypesCodec.decodeInt(initialFrame.content, PORT_OFFSET);

        const host = StringCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new AddressImpl(host, port);
    }
}
