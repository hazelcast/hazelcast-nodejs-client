/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {SizeUtil} from '../../lib/codec/Utils';
import {Data} from '../serialization/Data';

var REQUEST_TYPE = 0x0101;
var RESPONSE_TYPE = 105;

export class MapPutCodec{
    static calculateSize(name: string, key: Data, value: Data, threadId: number, ttl: number){
        // Calculates the request payload size
        var dataSize = 0;
        dataSize += SizeUtil.getStringSize(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.calculateSizeData(value);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, key: Data, value: Data, threadId: number, ttl: number){
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, value, threadId, ttl));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.appendData(value);
        clientMessage.appendLong(threadId);
        clientMessage.appendLong(ttl);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage){
        // Decode response from client message
        var parameters: any = {};
        parameters['response'] = null;

        if(clientMessage.readBoolean() !== true){
            parameters['response'] = clientMessage.readData();
        }
        return parameters;
    }


}
