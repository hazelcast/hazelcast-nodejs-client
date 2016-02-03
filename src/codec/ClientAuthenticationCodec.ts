import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_AUTHENTICATION
var RESPONSE_TYPE = 107
var RETRYABLE = true


export class ClientAuthenticationCodec{

constructor() {
}




static calculateSize(username, password, uuid, ownerUuid, isOwnerConnection, clientType, serializationVersion){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(username);
    dataSize += BitsUtil.calculateSizeStr(password);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(uuid !== null) {
    dataSize += BitsUtil.calculateSizeStr(uuid);
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(ownerUuid !== null) {
    dataSize += BitsUtil.calculateSizeStr(ownerUuid);
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    dataSize += BitsUtil.calculateSizeStr(clientType);
    dataSize += BitsUtil.BYTE_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(username, password, uuid, ownerUuid, isOwnerConnection, clientType, serializationVersion){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(username, password, uuid, ownerUuid, isOwnerConnection, clientType, serializationVersion));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(username);
    clientMessage.appendStr(password);
    clientMessage.appendBool(uuid === null);
    if(uuid !== null){
    clientMessage.appendStr(uuid);
    }
    clientMessage.appendBool(ownerUuid === null);
    if(ownerUuid !== null){
    clientMessage.appendStr(ownerUuid);
    }
    clientMessage.appendBool(isOwnerConnection);
    clientMessage.appendStr(clientType);
    clientMessage.appendByte(serializationVersion);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['status'] = clientMessage.readByte();

if(clientMessage.readBool() === true){
    parameters['address'] = AddressCodec.decode(clientMessage)
}

if(clientMessage.readBool() === true){
    parameters['uuid'] = clientMessage.readStr();
}

if(clientMessage.readBool() === true){
    parameters['ownerUuid'] = clientMessage.readStr();
}
    parameters['serializationVersion'] = clientMessage.readByte();
    return parameters;

}


}
