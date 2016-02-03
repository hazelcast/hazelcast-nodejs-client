import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ExecutorServiceMessageType} from './ExecutorServiceMessageType';

var REQUEST_TYPE = ExecutorServiceMessageType.EXECUTORSERVICE_CANCELONADDRESS
var RESPONSE_TYPE = 101
var RETRYABLE = false


export class ExecutorServiceCancelOnAddressCodec{

constructor() {
}




static calculateSize(uuid, address, interrupt){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(uuid);
    dataSize += BitsUtil.calculateSizeCom.hazelcast.nio.address(address);
    dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    return dataSize;
}

static encodeRequest(uuid, address, interrupt){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(uuid, address, interrupt));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(uuid);
    AddressCodec.encode(clientMessage, address);
    clientMessage.appendBool(interrupt);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    parameters['response'] = clientMessage.readBool();
    return parameters;

}


}
