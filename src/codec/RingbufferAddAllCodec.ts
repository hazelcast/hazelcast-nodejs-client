/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {RingbufferMessageType} from './RingbufferMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = RingbufferMessageType.RINGBUFFER_ADDALL;
var RESPONSE_TYPE = 103;
var RETRYABLE = false;


export class RingbufferAddAllCodec {


    static calculateSize(name: string, valueList: any, overflowPolicy: number) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        valueList.forEach((valueListItem: any) => {
            dataSize += BitsUtil.calculateSizeData(valueListItem);
        });
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, valueList: any, overflowPolicy: number) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, valueList, overflowPolicy));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(valueList.length);

        valueList.forEach((valueListItem: any) => {
            clientMessage.appendData(valueListItem);
        });

        clientMessage.appendInt32(overflowPolicy);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'response': null};
        parameters['response'] = clientMessage.readLong();
        return parameters;

    }


}
