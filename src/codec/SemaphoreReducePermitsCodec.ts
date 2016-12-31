/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {SemaphoreMessageType} from './SemaphoreMessageType';

const REQUEST_TYPE = SemaphoreMessageType.SEMAPHORE_REDUCEPERMITS;
const RESPONSE_TYPE = 100;
const RETRYABLE = false;

export class SemaphoreReducePermitsCodec {

    static calculateSize(name: string, reduction: number) {
// Calculates the request payload size
        let dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, reduction: number) {
// Encode request into clientMessage
        const clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, reduction));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(reduction);
        clientMessage.updateFrameLength();
        return clientMessage;
    }
}
