/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {SemaphoreMessageType} from './SemaphoreMessageType';

const REQUEST_TYPE = SemaphoreMessageType.SEMAPHORE_DRAINPERMITS;
const RESPONSE_TYPE = 102;
const RETRYABLE = true;

export class SemaphoreDrainPermitsCodec {

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
        parameters['response'] = clientMessage.readInt32();
        return parameters;
    }
}
