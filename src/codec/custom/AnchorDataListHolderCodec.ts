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
import {ClientMessage, BEGIN_FRAME, END_FRAME} from '../../protocol/ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {ListIntegerCodec} from '../builtin/ListIntegerCodec';
import {AnchorDataListHolder} from '../../protocol/AnchorDataListHolder';
import {EntryListCodec} from '../builtin/EntryListCodec';
import {DataCodec} from '../builtin/DataCodec';

/** @internal */
export class AnchorDataListHolderCodec {
    static encode(clientMessage: ClientMessage, anchorDataListHolder: AnchorDataListHolder): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        ListIntegerCodec.encode(clientMessage, anchorDataListHolder.anchorPageList);
        EntryListCodec.encode(clientMessage, anchorDataListHolder.anchorDataList, DataCodec.encode, DataCodec.encode);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): AnchorDataListHolder {
        // begin frame
        clientMessage.nextFrame();

        const anchorPageList = ListIntegerCodec.decode(clientMessage);
        const anchorDataList = EntryListCodec.decode(clientMessage, DataCodec.decode, DataCodec.decode);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new AnchorDataListHolder(anchorPageList, anchorDataList);
    }
}
