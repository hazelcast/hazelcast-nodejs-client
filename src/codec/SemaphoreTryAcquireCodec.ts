/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {SemaphoreMessageType} from './SemaphoreMessageType';
import Long = require('long');

const REQUEST_TYPE = SemaphoreMessageType.SEMAPHORE_TRYACQUIRE;
const RESPONSE_TYPE = 101;
const RETRYABLE = false;

export class SemaphoreTryAcquireCodec {

    static calculateSize(name: string, permits: number, timeout: Long|number|string) {
// Calculates the request payload size
        let dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, permits: number, timeout: Long|number|string) {
// Encode request into clientMessage
        const clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, permits, timeout));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(permits);
        clientMessage.appendLong(timeout);
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
