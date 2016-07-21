/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {QueueMessageType} from './QueueMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = QueueMessageType.QUEUE_DRAINTO;
var RESPONSE_TYPE = 106;
var RETRYABLE = false;


export class QueueDrainToCodec {


    static calculateSize(name: string) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        return dataSize;
    }

    static encodeRequest(name: string) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'response': null};
        var responseSize = clientMessage.readInt32();
        var response: any = [];
        for (var responseIndex = 0; responseIndex < responseSize; responseIndex++) {
            var responseItem: Data;
            responseItem = clientMessage.readData();
            response.push(responseItem)
        }
        parameters['response'] = response;
        return parameters;

    }


}
