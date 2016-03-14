/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';
import {MemberCodec} from './MemberCodec';
import {Member} from '../Member';

var REQUEST_TYPE = 0x0004;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class AddMembershipListenerCodec {


    static calculateSize(localOnly: boolean) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(localOnly: boolean) {
        // Encode request into clientMessage
        var client_message = ClientMessage.newClientMessage(this.calculateSize(localOnly));
        client_message.setMessageType(REQUEST_TYPE);
        client_message.setRetryable(RETRYABLE);
        client_message.appendBoolean(localOnly);
        client_message.updateFrameLength();
        return client_message
    }

    static decodeResponse(clientMessage:ClientMessage, toObjectFunction:(data:Data) => any = null) {
        // Decode response from client message
        var parameters:any = { 'response': null};
        parameters['response'] = clientMessage.readString();
        return parameters;
    }

    static handle(clientMessage: ClientMessage, handleEventMember: any, handleEventMemberlist: any,
                  handleEventMemberAttributeChange: any, toObject: any) {
        var messageType = clientMessage.getMessageType();
        if (messageType === 200 && handleEventMember != null) {
            var member = MemberCodec.decode(clientMessage);
            var eventType = clientMessage.readInt32();
            handleEventMember(member, eventType);
        } else if (messageType === 201 && handleEventMemberlist != null) {
            var memberSize = clientMessage.readInt32();
            var members: Member[] = [];
            for (var i = 0; i<memberSize; i++) {
                members.push(MemberCodec.decode(clientMessage));
            }
            handleEventMemberlist(members);
        } else if (messageType === 202 && handleEventMemberAttributeChange != null) {
            var uuid = clientMessage.readString();
            var key = clientMessage.readString();
            var operationType = clientMessage.readInt32();
            var value: string = null;
            if (clientMessage.readBoolean() === false) {
                value = clientMessage.readString();
            }
            handleEventMemberAttributeChange(uuid, key, operationType, value);
        }
    }
}
