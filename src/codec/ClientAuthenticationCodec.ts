/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_AUTHENTICATION;
var RESPONSE_TYPE = 107;
var RETRYABLE = true;


export class ClientAuthenticationCodec{



static calculateSize(username : string  , password : string  , uuid : string  , ownerUuid : string  , isOwnerConnection : boolean  , clientType : string  , serializationVersion : any ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(username);
            dataSize += BitsUtil.calculateSizeString(password);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(uuid !== null) {
            dataSize += BitsUtil.calculateSizeString(uuid);
    }
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    if(ownerUuid !== null) {
            dataSize += BitsUtil.calculateSizeString(ownerUuid);
    }
            dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
            dataSize += BitsUtil.calculateSizeString(clientType);
            dataSize += BitsUtil.BYTE_SIZE_IN_BYTES;
return dataSize;
}

static encodeRequest(username : string, password : string, uuid : string, ownerUuid : string, isOwnerConnection : boolean, clientType : string, serializationVersion : any){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(username, password, uuid, ownerUuid, isOwnerConnection, clientType, serializationVersion));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(username);
    clientMessage.appendString(password);
    clientMessage.appendBoolean(uuid === null);
    if(uuid !== null){
    clientMessage.appendString(uuid);
    }
    clientMessage.appendBoolean(ownerUuid === null);
    if(ownerUuid !== null){
    clientMessage.appendString(ownerUuid);
    }
    clientMessage.appendBoolean(isOwnerConnection);
    clientMessage.appendString(clientType);
    clientMessage.appendByte(serializationVersion);
clientMessage.updateFrameLength();
return clientMessage;
}

static decodeResponse(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null){
// Decode response from client message
var parameters :any = { 'status' : null , 'address' : null , 'uuid' : null , 'ownerUuid' : null , 'serializationVersion' : null  };
                    parameters['status'] = clientMessage.readByte();

    if(clientMessage.readBoolean() !== true){
            parameters['address'] = AddressCodec.decode(clientMessage, toObjectFunction);
    }

    if(clientMessage.readBoolean() !== true){
                    parameters['uuid'] = clientMessage.readString();
    }

    if(clientMessage.readBoolean() !== true){
                    parameters['ownerUuid'] = clientMessage.readString();
    }
                    parameters['serializationVersion'] = clientMessage.readByte();
return parameters;

}


}
