/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require("../Address");

var REQUEST_TYPE = 0x5;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class ClientCreateProxyCodec{

    constructor() {
    }

    static calculateSize(name: string, serviceName: string, target: Address){
        // Calculates the request payload size
        var dataSize = 0;
        dataSize += BitsUtil.getStringSize(name);
        dataSize += BitsUtil.getStringSize(serviceName);
        dataSize += BitsUtil.getStringSize(target.host);
        dataSize += 4;
        return dataSize;
    }

    static encodeRequest(name: string, serviceName: string, target: Address){
        // Encode request into client_message
        var payloadSize: number;
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, serviceName, target));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.appendString(name);
        clientMessage.appendString(serviceName);
        clientMessage.appendString(target.host);
        clientMessage.appendInt32(target.port);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage){
        // Decode response from client message
        var parameters = clientMessage;
        return parameters;

    }

}
