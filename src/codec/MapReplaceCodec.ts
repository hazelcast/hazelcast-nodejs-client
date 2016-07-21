/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = MapMessageType.MAP_REPLACE;
var RESPONSE_TYPE = 105;
var RETRYABLE = false;


export class MapReplaceCodec {


    static calculateSize(name: string, key: Data, value: Data, threadId: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.calculateSizeData(value);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, key: Data, value: Data, threadId: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, value, threadId));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.appendData(value);
        clientMessage.appendLong(threadId);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'response': null};

        if (clientMessage.readBoolean() !== true) {
            parameters['response'] = toObjectFunction(clientMessage.readData());
        }
        return parameters;

    }


}
