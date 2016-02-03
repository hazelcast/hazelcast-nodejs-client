import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {ExecutorServiceMessageType} from './ExecutorServiceMessageType';

var REQUEST_TYPE = ExecutorServiceMessageType.EXECUTORSERVICE_SUBMITTOADDRESS
var RESPONSE_TYPE = 105
var RETRYABLE = false


export class ExecutorServiceSubmitToAddressCodec{

constructor() {
}




static calculateSize(name, uuid, callable, address){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(uuid);
    dataSize += BitsUtil.calculateSizeData(callable);
    dataSize += BitsUtil.calculateSizeCom.hazelcast.nio.address(address);
    return dataSize;
}

static encodeRequest(name, uuid, callable, address){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, uuid, callable, address));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(uuid);
    clientMessage.appendData(callable);
    AddressCodec.encode(clientMessage, address);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;

if(clientMessage.readBool() === true){
    parameters['response'] = clientMessage.readData();
}
    return parameters;

}


}
