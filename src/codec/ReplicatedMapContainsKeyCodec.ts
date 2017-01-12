/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {ReplicatedMapMessageType} from './ReplicatedMapMessageType';

const REQUEST_TYPE = ReplicatedMapMessageType.REPLICATEDMAP_CONTAINSKEY;
const RESPONSE_TYPE = 101;
const RETRYABLE = true;


export class ReplicatedMapContainsKeyCodec {


    static calculateSize(name: string, key: Data) {
// Calculates the request payload size
        let dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        return dataSize;
    }

    static encodeRequest(name: string, key: Data) {
// Encode request into clientMessage
        const clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.updateFrameLength();
        return clientMessage;
    }


    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        const parameters: any = {'response': null};
        parameters['response'] = clientMessage.readBoolean();
        return parameters;
    }

}
