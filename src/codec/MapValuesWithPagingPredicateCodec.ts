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
import {ClientMessage, Frame, PARTITION_ID_OFFSET, UNFRAGMENTED_MESSAGE} from '../ClientMessage';
import {StringCodec} from './builtin/StringCodec';
import {PagingPredicateHolder} from '../protocol/PagingPredicateHolder';
import {PagingPredicateHolderCodec} from './custom/PagingPredicateHolderCodec';
import {Data} from '../serialization/Data';
import {ListMultiFrameCodec} from './builtin/ListMultiFrameCodec';
import {DataCodec} from './builtin/DataCodec';
import {AnchorDataListHolder} from '../protocol/AnchorDataListHolder';
import {AnchorDataListHolderCodec} from './custom/AnchorDataListHolderCodec';

// hex: 0x013500
const REQUEST_MESSAGE_TYPE = 79104;
// hex: 0x013501
const RESPONSE_MESSAGE_TYPE = 79105;

const REQUEST_INITIAL_FRAME_SIZE = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

export interface MapValuesWithPagingPredicateResponseParams {
    response: Data[];
    anchorDataList: AnchorDataListHolder;
}
export class MapValuesWithPagingPredicateCodec {
    static encodeRequest(name: string, predicate: PagingPredicateHolder): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(true);

        const initialFrame = new Frame(Buffer.allocUnsafe(REQUEST_INITIAL_FRAME_SIZE), UNFRAGMENTED_MESSAGE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        StringCodec.encode(clientMessage, name);
        PagingPredicateHolderCodec.encode(clientMessage, predicate);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): MapValuesWithPagingPredicateResponseParams {
        const iterator = clientMessage.frameIterator();
        // empty initial frame
        iterator.getNextFrame();

        return {
            response: ListMultiFrameCodec.decode(iterator, DataCodec.decode),
            anchorDataList: AnchorDataListHolderCodec.decode(iterator),
        };
    }
}
