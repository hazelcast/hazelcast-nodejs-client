/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_ADDMEMBERSHIPLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class ClientAddMembershipListenerCodec {


    static calculateSize(localOnly:boolean) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(localOnly:boolean) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendBoolean(localOnly);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage:ClientMessage, toObjectFunction:(data:Data) => any = null) {
        // Decode response from client message
        var parameters:any = {'response': null};
        parameters['response'] = clientMessage.readString();
        return parameters;

    }

    static handle(clientMessage:ClientMessage, handleEventMember:any, handleEventMemberlist:any, handleEventMemberattributechange:any, toObjectFunction:(data:Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_MEMBER && handleEventMember !== null) {
            var member:any;
            member = MemberCodec.decode(clientMessage);
            var eventType:number;
            eventType = clientMessage.readInt32();
            handleEventMember(member, eventType);
        }
        if (messageType === BitsUtil.EVENT_MEMBERLIST && handleEventMemberlist !== null) {
            var members:any;
            var membersSize = clientMessage.readInt32();
            members = [];
            for (var membersIndex = 0; membersIndex < membersSize; membersIndex++) {
                var membersItem:any;
                membersItem = MemberCodec.decode(clientMessage);
                members.push(membersItem)
            }
            handleEventMemberlist(members);
        }
        if (messageType === BitsUtil.EVENT_MEMBERATTRIBUTECHANGE && handleEventMemberattributechange !== null) {
            var uuid:string;
            uuid = clientMessage.readString();
            var key:string;
            key = clientMessage.readString();
            var operationType:number;
            operationType = clientMessage.readInt32();
            var value:string;

            if (clientMessage.readBoolean() !== true) {
                value = clientMessage.readString();
            }
            handleEventMemberattributechange(uuid, key, operationType, value);
        }
    }

}
