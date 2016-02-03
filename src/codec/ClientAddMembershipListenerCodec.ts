import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_ADDMEMBERSHIPLISTENER
var RESPONSE_TYPE = 104
var RETRYABLE = false


export class ClientAddMembershipListenerCodec{

constructor() {
}




static calculateSize(localOnly){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(localOnly){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(localOnly));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendBool(localOnly);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readStr();
    return parameters;

}


static handle(clientMessage, handleEventMEMBER , handleEventMEMBERLIST , handleEventMEMBERATTRIBUTECHANGE ){
    // Event handler
    var messageType = clientMessage.getMessageType();
    if ( messageType === EVENT_MEMBER && handleEventMEMBER !== null) {
    member = MemberCodec.decode(clientMessage)
    eventType = clientMessage.readInt();
        handleEventMEMBER(member, eventType)
    }
    if ( messageType === EVENT_MEMBERLIST && handleEventMEMBERLIST !== null) {
    membersSize = clientMessage.readInt();
    members = [];
    for(var membersIndex = 0 ;  membersIndex <= membersSize ; membersIndex++){
    membersItem = MemberCodec.decode(clientMessage)
        members.push(membersItem)
    }
        handleEventMEMBERLIST(members)
    }
    if ( messageType === EVENT_MEMBERATTRIBUTECHANGE && handleEventMEMBERATTRIBUTECHANGE !== null) {
    uuid = clientMessage.readStr();
    key = clientMessage.readStr();
    operationType = clientMessage.readInt();

if(clientMessage.readBool() === true){
    value = clientMessage.readStr();
}
        handleEventMEMBERATTRIBUTECHANGE(uuid, key, operationType, value)
    }
}
}
