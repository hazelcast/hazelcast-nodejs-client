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
         * Name of the Topic
         */
        public name: string;

        /**
         * if true listens only local events on registered member
         */
        public localOnly: boolean;
    };

    /* tslint:disable:urf-unread-public-or-protected-field */
   export class ResponseParameters {

        /**
         * returns the registration id
         */
        public response : string;
    };

/**
 * Subscribes to this topic. When someone publishes a message on this topic. onMessage() function of the given
 * MessageListener is called. More than one message listener can be added on one instance.
 */
export class TopicAddMessageListenerCodec {
    //hex: 0x040200
    public static REQUEST_MESSAGE_TYPE = 262656;
    //hex: 0x040201
    public static RESPONSE_MESSAGE_TYPE = 262657;
    private static REQUEST_LOCAL_ONLY_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    private static REQUEST_INITIAL_FRAME_SIZE = TopicAddMessageListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET + FixedSizeTypes.BOOLEAN_SIZE_IN_BYTES;
    private static RESPONSE_INITIAL_FRAME_SIZE = ClientMessage.CORRELATION_ID_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    static EVENT_TOPIC_PUBLISH_TIME_FIELD_OFFSET = ClientMessage.PARTITION_ID_FIELD_OFFSET + FixedSizeTypes.INT_SIZE_IN_BYTES;
    static EVENT_TOPIC_INITIAL_FRAME_SIZE = TopicAddMessageListenerCodec.EVENT_TOPIC_PUBLISH_TIME_FIELD_OFFSET + FixedSizeTypes.LONG_SIZE_IN_BYTES;
    //hex: 0x040202
    static EVENT_TOPIC_MESSAGE_TYPE = 262658;

    private TopicAddMessageListenerCodec() {
    }


    static encodeRequest(name: string, localOnly: boolean) {
        var clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setAcquiresResource(false);
        clientMessage.setOperationName("Topic.AddMessageListener");
        var initialFrame : Frame= new Frame(Buffer.allocUnsafe(TopicAddMessageListenerCodec.REQUEST_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, TopicAddMessageListenerCodec.REQUEST_MESSAGE_TYPE);
        FixedSizeTypes.encodeBoolean(initialFrame.content, TopicAddMessageListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET, localOnly);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeRequest(clientMessage : ClientMessage) {
        var frame : Frame = clientMessage.get();
        var request : RequestParameters = new RequestParameters();
        var initialFrame : Frame= frame.next;
        request.localOnly =  FixedSizeTypes.decodeBoolean(initialFrame.content, TopicAddMessageListenerCodec.REQUEST_LOCAL_ONLY_FIELD_OFFSET);
        request.name = StringCodec.decode(frame);
        return request;
    }


     static encodeResponse(response: string ) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(TopicAddMessageListenerCodec.RESPONSE_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, TopicAddMessageListenerCodec.RESPONSE_MESSAGE_TYPE);
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

     static encodeTopicEvent( item : Data,  publishTime : Long,  uuid : string) {
        var clientMessage = ClientMessage.createForEncode();
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(TopicAddMessageListenerCodec.EVENT_TOPIC_INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        initialFrame.flags |= ClientMessage.IS_EVENT_FLAG;
        FixedSizeTypes.encodeInt(initialFrame.content, ClientMessage.TYPE_FIELD_OFFSET, TopicAddMessageListenerCodec.EVENT_TOPIC_MESSAGE_TYPE);
        FixedSizeTypes.encodeLong(initialFrame.content, TopicAddMessageListenerCodec.EVENT_TOPIC_PUBLISH_TIME_FIELD_OFFSET, publishTime);
        clientMessage.add(initialFrame);
        DataCodec.encode(clientMessage, item);
        StringCodec.encode(clientMessage, uuid);
        return clientMessage;
    }

static handle(clientMessage : ClientMessage,  handleTopic: any, toObjectFunction: (data: Data) => any = null) {
            var messageType = clientMessage.getMessageType();
            var frame : Frame = clientMessage.get();
            if (messageType == TopicAddMessageListenerCodec.EVENT_TOPIC_MESSAGE_TYPE) {
                var initialFrame : Frame = frame.next;
                var publishTime : Long  = FixedSizeTypes.decodeLong(initialFrame.content, TopicAddMessageListenerCodec.EVENT_TOPIC_PUBLISH_TIME_FIELD_OFFSET);
                var item : Data = DataCodec.decode(frame);
                var uuid : string = StringCodec.decode(frame);
                handleTopic(item, publishTime, uuid);
                return;
            }
        }
}