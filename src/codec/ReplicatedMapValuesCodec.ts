/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {ReplicatedMapMessageType} from './ReplicatedMapMessageType';

const REQUEST_TYPE = ReplicatedMapMessageType.REPLICATEDMAP_VALUES;
const RESPONSE_TYPE = 106;
const RETRYABLE = true;


export class ReplicatedMapValuesCodec {


    static calculateSize(name: string) {
// Calculates the request payload size
        let dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        return dataSize;
    }

    static encodeRequest(name: string) {
// Encode request into clientMessage
        const clientMessage = ClientMessage.newClientMessage(this.calculateSize(name));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        const parameters: any = {'response': null};
        const responseSize = clientMessage.readInt32();
        const response: any = [];
        for (let responseIndex = 0; responseIndex < responseSize; responseIndex++) {
            let responseItem: Data;
            responseItem = clientMessage.readData();
            response.push(responseItem)
        }
        parameters['response'] = response;
        return parameters;

    }
}
