/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {AddressCodec} from './AddressCodec';
import {ClientMessageType} from './ClientMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = ClientMessageType.CLIENT_CREATEPROXY;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class ClientCreateProxyCodec {


    static calculateSize(name: string, serviceName: string, target: Address) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(serviceName);
        dataSize += BitsUtil.calculateSizeAddress(target);
        return dataSize;
    }

    static encodeRequest(name: string, serviceName: string, target: Address) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, serviceName, target));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(serviceName);
        AddressCodec.encode(clientMessage, target);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
