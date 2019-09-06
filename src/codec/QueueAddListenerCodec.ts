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
     * Name of the Queue
     */
    public name: string;

    /**
     * <tt>true</tt> if the updated item should be passed to the item listener, <tt>false</tt> otherwise.
     */
    public includeValue: boolean;

    /**
     * if true fires events that originated from this node only, otherwise fires all events
     */
    public localOnly: boolean;
}

/* tslint:disable:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
export class ResponseParameters {

    /**
     * The registration id
     */
    public response: string;
}

/**
 * Adds an listener for this collection. Listener will be notified or all collection add/remove events.
 */
/* tslint:disable:max-line-length no-bitwise */
export class QueueAddListenerCodec {
    // hex: 0x031100
    public static REQUEST_MESSAGE_TYPE = 200960;
    // hex: 0x031101
    public static RESPONSE_MESSAGE_TYPE = 200961;
    private static REQUEST_INCLUDE_VALUE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_LOCAL_ONLY_FIELD_OFFSET = QueueAddListenerCodec.REQUEST_INCLUDE_VALUE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = QueueAddListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    private static EVENT_ITEM_EVENT_TYPE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static EVENT_ITEM_INITIAL_FRAME_SIZE = QueueAddListenerCodec.EVENT_ITEM_EVENT_TYPE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    // hex: 0x031102
    private static EVENT_ITEM_MESSAGE_TYPE = 200962;

    static encodeRequest(name: string, includeValue: boolean, localOnly: boolean): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName('Queue.AddListener');
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(QueueAddListenerCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, QueueAddListenerCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, QueueAddListenerCodec.REQUEST_INCLUDE_VALUE_FIELD_OFFSET, includeValue);
        FixedSizeTypes.encodeBoolean(initialFrame.content, QueueAddListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET, localOnly);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage: ClientMessage): RequestParameters {
        const request: RequestParameters = new RequestParameters();
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        request.includeValue =  FixedSizeTypes.decodeBoolean(initialFrame.content, QueueAddListenerCodec.REQUEST_INCLUDE_VALUE_FIELD_OFFSET);
        request.localOnly =  FixedSizeTypes.decodeBoolean(initialFrame.content, QueueAddListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        return request;
    }

     static encodeResponse(response: string ): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(QueueAddListenerCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, QueueAddListenerCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage): ResponseParameters {
        const response: ResponseParameters = new ResponseParameters();
        // empty initial frame
        let frame: Frame = clientMessage.get();
        frame = frame.next;
        response.response = StringCodec.decode(frame);
        return response;
    }

     static encodeItemEvent( item: Data,  uuid: string,  eventType: number): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(QueueAddListenerCodec.EVENT_ITEM_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, QueueAddListenerCodec.EVENT_ITEM_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, QueueAddListenerCodec.EVENT_ITEM_EVENT_TYPE_FIELD_OFFSET, eventType);
        clientMessage.add(initialFrame);
        CodecUtil.encodeNullable(clientMessage,  item, DataCodec.encode );
        StringCodec.encode(clientMessage, uuid);
        return clientMessage;
    }

    static handle(clientMessage: ClientMessage,  handleItem: any, toObjectFunction: (data: Data) => any = null): void {
        const messageType = clientMessage.getMessageType();
        if (messageType === QueueAddListenerCodec.EVENT_ITEM_MESSAGE_TYPE) {
        const frame: Frame = clientMessage.get();
        const initialFrame: Frame = frame.next;
        const eventType: number  = FixedSizeTypes.decodeInt(initialFrame.content, QueueAddListenerCodec.EVENT_ITEM_EVENT_TYPE_FIELD_OFFSET);
        const item: Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
        const uuid: string = StringCodec.decode(frame);
        handleItem(item, uuid, eventType);
        return;
        }
    }
}
