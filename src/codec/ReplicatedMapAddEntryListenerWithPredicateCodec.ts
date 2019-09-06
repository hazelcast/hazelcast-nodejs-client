/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import * as Long from 'long';
import {Address} from '../Address';
import {AddressCodec} from '../builtin/AddressCodec';
import {MemberCodec} from '../builtin/MemberCodec';
import {Data} from '../serialization/Data';
import {SimpleEntryViewCodec} from '../builtin/SimpleEntryViewCodec';
import {DistributedObjectInfoCodec} from '../builtin/DistributedObjectInfoCodec';
import {DistributedObjectInfo} from '../builtin/DistributedObjectInfo';
import {Member} from '../core/Member';
import {UUID} from '../core/UUID';
import {FixedSizeTypes} from '../builtin/FixedSizeTypes';
import {BitsUtil} from '../BitsUtil';
import {ClientConnection} from '../invocation/ClientConnection';
import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {ClientProtocolErrorCodes} from '../protocol/ClientProtocolErrorCodes';
import {CodecUtil} from '../builtin/CodecUtil';
import {DataCodec} from '../builtin/DataCodec';
import {ErrorCodec} from '../protocol/ErrorCodec';
import {ErrorsCodec} from '../protocol/ErrorsCodec';
import {ListIntegerCodec} from '../builtin/ListIntegerCodec';
import {ListUUIDCodec} from '../builtin/ListUUIDCodec';
import {ListLongCodec} from '../builtin/ListLongCodec';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {LongArrayCodec} from '../builtin/LongArrayCodec';
import {MapCodec} from '../builtin/MapCodec';
import {MapIntegerLongCodec} from '../builtin/MapIntegerLongCodec';
import {MapIntegerUUIDCodec} from '../builtin/MapIntegerUUIDCodec';
import {MapStringLongCodec} from '../builtin/MapStringLongCodec';
import {MapUUIDLongCodec} from '../builtin/MapUUIDLongCodec';
import {StackTraceElementCodec} from '../protocol/StackTraceElementCodec';
import {StringCodec} from '../builtin/StringCodec';

/* tslint:disabled:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class RequestParameters {

    /**
     * Name of the Replicated Map
     */
    public name: string;

    /**
     * The predicate for filtering entries
     */
    public predicate: Data;

    /**
     * if true fires events that originated from this node only, otherwise fires all events
     */
    public localOnly: boolean;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * A unique string  which is used as a key to remove the listener.
     */
    public response: string;
}

/**
 * Adds an continuous entry listener for this map. The listener will be notified for map add/remove/update/evict
 * events filtered by the given predicate.
 */
/* tslint:disable:max-line-length no-bitwise */
export class ReplicatedMapAddEntryListenerWithPredicateCodec {
    // hex: 0x0E0B00
    public static REQUEST_MESSAGE_TYPE = 920320;
    // hex: 0x0E0B01
    public static RESPONSE_MESSAGE_TYPE = 920321;
    private static REQUEST_LOCAL_ONLY_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = ReplicatedMapAddEntryListenerWithPredicateCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static EVENT_ENTRY_EVENT_TYPE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_FIELD_OFFSET = ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_EVENT_TYPE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static EVENT_ENTRY_INITIAL_FRAME_SIZE = ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    // hex: 0x0E0B02
    private static EVENT_ENTRY_MESSAGE_TYPE = 920322;

    static encodeRequest(name: string, predicate: Data, localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('ReplicatedMap.AddEntryListenerWithPredicate');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ReplicatedMapAddEntryListenerWithPredicateCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ReplicatedMapAddEntryListenerWithPredicateCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, ReplicatedMapAddEntryListenerWithPredicateCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET, localOnly);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, predicate);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.localOnly =  FixedSizeTypes.decodeBoolean(initialFrame.content, ReplicatedMapAddEntryListenerWithPredicateCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.predicate = DataCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: string ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ReplicatedMapAddEntryListenerWithPredicateCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ReplicatedMapAddEntryListenerWithPredicateCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        response.response = StringCodec.decode(frame);
        return response;
    }

     static encodeEntryEvent( key: Data,  value: Data,  oldValue: Data,  mergingValue: Data,  eventType: number,  uuid: string,  numberOfAffectedEntries: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_EVENT_TYPE_FIELD_OFFSET, eventType);
        FixedSizeTypes.encodeInt(initialFrame.content, ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_FIELD_OFFSET, numberOfAffectedEntries);
        clientMessage.add(initialFrame);
        CodecUtil.encodeNullable(clientMessage,  key, DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  value, DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  oldValue, DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  mergingValue, DataCodec.encode );
        StringCodec.encode(clientMessage, uuid);
        return clientMessage;
    }

    static handle(clientMessage: ClientMessage,  handleEntry: any, toObjectFunction: (data: Data) => any = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_MESSAGE_TYPE) {
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        const eventType: number  = FixedSizeTypes.decodeInt(initialFrame.content, ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_EVENT_TYPE_FIELD_OFFSET);
        const numberOfAffectedEntries: number  = FixedSizeTypes.decodeInt(initialFrame.content, ReplicatedMapAddEntryListenerWithPredicateCodec.EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_FIELD_OFFSET);
        const key: Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
        const value: Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
        const oldValue: Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
        const mergingValue: Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
        const uuid: string = StringCodec.decode(frame);
        handleEntry(key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries);
        return;
        }
    }
}
