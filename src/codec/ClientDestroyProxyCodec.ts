/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');

var REQUEST_TYPE = 0x6;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class ClientDestroyProxyCodec{

    constructor() {
    }

    static calculateSize(name: string, serviceName: string){
        // Calculates the request payload size
        var dataSize = 0;
        dataSize += BitsUtil.getStringSize(name);
        dataSize += BitsUtil.getStringSize(serviceName);
        return dataSize;
    }

    static encodeRequest(name: string, serviceName: string){
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, serviceName));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.appendString(name);
        clientMessage.appendString(serviceName);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage){
        // Decode response from client message
        var parameters = clientMessage;
        return parameters;

    }

}
