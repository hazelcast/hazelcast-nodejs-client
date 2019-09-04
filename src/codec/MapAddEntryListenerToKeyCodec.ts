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

/* tslint:disable */
import * as Long from 'long';
import {Address} from '../Address';
import {AddressCodec} from'../builtin/AddressCodec';
import {MemberCodec} from '../builtin/MemberCodec';
import {Data} from '../serialization/Data';
import {SimpleEntryViewCodec} from '../builtin/SimpleEntryViewCodec';
import {DistributedObjectInfoCodec} from '../builtin/DistributedObjectInfoCodec';
import {DistributedObjectInfo} from '../builtin/DistributedObjectInfo';
import {Member} from '../core/Member';
import {UUID} from '../core/UUID';
import {FixedSizeTypes} from '../builtin/FixedSizeTypes'
import {BitsUtil} from '../BitsUtil'
import {ClientConnection} from '../invocation/ClientConnection'
import {ClientMessage, Frame} from '../ClientMessage'
import {Buffer} from 'safe-buffer'
import {ClientProtocolErrorCodes} from '../protocol/ClientProtocolErrorCodes'
import {CodecUtil} from '../builtin/CodecUtil'
import {DataCodec} from '../builtin/DataCodec'
import {ErrorCodec} from '../protocol/ErrorCodec'
import {ErrorsCodec} from '../protocol/ErrorsCodec'
import {ListIntegerCodec} from '../builtin/ListIntegerCodec'
import {ListUUIDCodec} from '../builtin/ListUUIDCodec'
import {ListLongCodec} from '../builtin/ListLongCodec'
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec'
import {LongArrayCodec} from '../builtin/LongArrayCodec'
import {MapCodec} from '../builtin/MapCodec'
import {MapIntegerLongCodec} from '../builtin/MapIntegerLongCodec'
import {MapIntegerUUIDCodec} from '../builtin/MapIntegerUUIDCodec'
import {MapStringLongCodec} from '../builtin/MapStringLongCodec'
import {MapUUIDLongCodec} from '../builtin/MapUUIDLongCodec'
import {StackTraceElementCodec} from '../protocol/StackTraceElementCodec'
import {StringCodec} from '../builtin/StringCodec'

    /* tslint:disabled:URF-UNREAD-PUBLIC-OR-PROTECTED-FIELD */
   export class RequestParameters {

        /**
         * name of map
         */
        public name: string;

        /**
         * Key for the map entry.
         */
        public key: Data;

        /**
         * true if EntryEvent should contain the value.
         */
        public includeValue: boolean;

        /**
         * flags of enabled listeners.
         */
        public listenerFlags: number;

        /**
         * if true fires events that originated from this node only, otherwise fires all events
         */
        public localOnly: boolean;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * A unique string which is used as a key to remove the listener.
         */
        public response : string;
    };

/**
 * Adds a MapListener for this map. To receive an event, you should implement a corresponding MapListener
 * sub-interface for that event.
 */
export class MapAddEntryListenerToKeyCodec {
    //hex: 0x011B00
    public static REQUEST_MESSAGE_TYPE = 72448;
    //hex: 0x011B01
    public static RESPONSE_MESSAGE_TYPE = 72449;
    private static REQUEST_INCLUDE_VALUE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_LISTENER_FLAGS_FIELD_OFFSET = MapAddEntryListenerToKeyCodec.REQUEST_INCLUDE_VALUE_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static REQUEST_LOCAL_ONLY_FIELD_OFFSET = MapAddEntryListenerToKeyCodec.REQUEST_LISTENER_FLAGS_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = MapAddEntryListenerToKeyCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    static EVENT_ENTRY_EVENT_TYPE_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    static EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_FIELD_OFFSET = MapAddEntryListenerToKeyCodec.EVENT_ENTRY_EVENT_TYPE_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    static EVENT_ENTRY_INITIAL_FRAME_SIZE = MapAddEntryListenerToKeyCodec.EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    //hex: 0x011B02
    static EVENT_ENTRY_MESSAGE_TYPE = 72450;

    private MapAddEntryListenerToKeyCodec() {
    }


    static encodeRequest(name: string, key: Data, includeValue: boolean, listenerFlags: number, localOnly: boolean) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Map.AddEntryListenerToKey");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(MapAddEntryListenerToKeyCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapAddEntryListenerToKeyCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, MapAddEntryListenerToKeyCodec.REQUEST_INCLUDE_VALUE_FIELD_OFFSET, includeValue);
        FixedSizeTypes.encodeInt(initialFrame.content, MapAddEntryListenerToKeyCodec.REQUEST_LISTENER_FLAGS_FIELD_OFFSET, listenerFlags);
        FixedSizeTypes.encodeBoolean(initialFrame.content, MapAddEntryListenerToKeyCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET, localOnly);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        DataCodec.encode(clientMessage, key);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.includeValue =  FixedSizeTypes.decodeBoolean(initialFrame.content, MapAddEntryListenerToKeyCodec.REQUEST_INCLUDE_VALUE_FIELD_OFFSET);
        request.listenerFlags =  FixedSizeTypes.decodeInt(initialFrame.content, MapAddEntryListenerToKeyCodec.REQUEST_LISTENER_FLAGS_FIELD_OFFSET);
        request.localOnly =  FixedSizeTypes.decodeBoolean(initialFrame.content, MapAddEntryListenerToKeyCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        request.key = DataCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: string ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(MapAddEntryListenerToKeyCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapAddEntryListenerToKeyCodec.RESPONSE_MESSAGE_TYPE);
        clientMessage.add(initialFrame);

        StringCodec.encode(clientMessage, response);
        return clientMessage;
    }

     static decodeResponse(clientMessage: ClientMessage) {
        var frame : Frame = clientMessage.get();
        var response : ResponseParameters = new ResponseParameters();
        //empty initial frame
        frame = frame.next;
        response.response = StringCodec.decode(frame);
        return response;
    }

     static encodeEntryEvent( key : Data,  value : Data,  oldValue : Data,  mergingValue : Data,  eventType : number,  uuid : string,  numberOfAffectedEntries : number) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(MapAddEntryListenerToKeyCodec.EVENT_ENTRY_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, MapAddEntryListenerToKeyCodec.EVENT_ENTRY_MESSAGE_TYPE);
        FixedSizeTypes.encodeInt(initialFrame.content, MapAddEntryListenerToKeyCodec.EVENT_ENTRY_EVENT_TYPE_FIELD_OFFSET, eventType);
        FixedSizeTypes.encodeInt(initialFrame.content, MapAddEntryListenerToKeyCodec.EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_FIELD_OFFSET, numberOfAffectedEntries);
        clientMessage.add(initialFrame);
        CodecUtil.encodeNullable(clientMessage,  key , DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  value , DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  oldValue , DataCodec.encode );
        CodecUtil.encodeNullable(clientMessage,  mergingValue , DataCodec.encode );
        StringCodec.encode(clientMessage, uuid);
        return clientMessage;
    }

static handle(clientMessage : ClientMessage,  handleEntry: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
            if (messageType == MapAddEntryListenerToKeyCodec.EVENT_ENTRY_MESSAGE_TYPE) {
                var initialFrame : Frame = frame.next;
                var eventType : number  = FixedSizeTypes.decodeInt(initialFrame.content, MapAddEntryListenerToKeyCodec.EVENT_ENTRY_EVENT_TYPE_FIELD_OFFSET);
                var numberOfAffectedEntries : number  = FixedSizeTypes.decodeInt(initialFrame.content, MapAddEntryListenerToKeyCodec.EVENT_ENTRY_NUMBER_OF_AFFECTED_ENTRIES_FIELD_OFFSET);
                var key : Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
                var value : Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
                var oldValue : Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
                var mergingValue : Data = CodecUtil.decodeNullable(frame, DataCodec.decode);
                var uuid : string = StringCodec.decode(frame);
                handleEntry(key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries);
                return;
            }
        }
}