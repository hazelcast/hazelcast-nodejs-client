/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {SetMessageType} from './SetMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = SetMessageType.SET_CONTAINSALL;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class SetContainsAllCodec {


    static calculateSize(name: string, items: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        items.forEach((itemsItem: any) => {
            dataSize += BitsUtil.calculateSizeData(itemsItem);
        });
        return dataSize;
    }

    static encodeRequest(name: string, items: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, items));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(items.length);

        items.forEach((itemsItem: any) => {
            clientMessage.appendData(itemsItem);
        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'response': null};
        parameters['response'] = clientMessage.readBoolean();
        return parameters;

    }


}
