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
import {ClientMessage, BEGIN_FRAME, END_FRAME, ForwardFrameIterator} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {ListIntegerCodec} from '../builtin/ListIntegerCodec';
import {EntryListCodec} from '../builtin/EntryListCodec';
import {DataCodec} from '../builtin/DataCodec';
import {Data} from '../../serialization/Data';
import {AnchorDataListHolder} from '../../protocol/AnchorDataListHolder';

export class AnchorDataListHolderCodec {
    static encode(clientMessage: ClientMessage, anchorDataListHolder: AnchorDataListHolder): void {
        clientMessage.add(BEGIN_FRAME.copy());

        ListIntegerCodec.encode(clientMessage, anchorDataListHolder.anchorPageList);
        EntryListCodec.encode(clientMessage, anchorDataListHolder.anchorDataList, DataCodec.encode, DataCodec.encode);

        clientMessage.add(END_FRAME.copy());
    }

    static decode(iterator: ForwardFrameIterator): AnchorDataListHolder {
        // begin frame
        iterator.getNextFrame();
        const anchorPageList: number[] = ListIntegerCodec.decode(iterator);
        const anchorDataList: Array<[Data, Data]> = EntryListCodec.decode(iterator, DataCodec.decode, DataCodec.decode);

        CodecUtil.fastForwardToEndFrame(iterator);

        return new AnchorDataListHolder(anchorPageList, anchorDataList);
    }
}
