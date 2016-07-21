/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {SetMessageType} from './SetMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = SetMessageType.SET_ADDALL;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class SetAddAllCodec {


    static calculateSize(name: string, valueList: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        valueList.forEach((valueListItem: any) => {
            dataSize += BitsUtil.calculateSizeData(valueListItem);
        });
        return dataSize;
    }

    static encodeRequest(name: string, valueList: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, valueList));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(valueList.length);

        valueList.forEach((valueListItem: any) => {
            clientMessage.appendData(valueListItem);
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
