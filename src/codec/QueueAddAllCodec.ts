/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {QueueMessageType} from './QueueMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = QueueMessageType.QUEUE_ADDALL;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class QueueAddAllCodec {


    static calculateSize(name: string, dataList: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        dataList.forEach((dataListItem: any) => {
            dataSize += BitsUtil.calculateSizeData(dataListItem);
        });
        return dataSize;
    }

    static encodeRequest(name: string, dataList: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, dataList));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(dataList.length);

        dataList.forEach((dataListItem: any) => {
            clientMessage.appendData(dataListItem);
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
