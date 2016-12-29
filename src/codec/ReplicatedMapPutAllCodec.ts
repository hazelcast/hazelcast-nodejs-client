/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {ReplicatedMapMessageType} from './ReplicatedMapMessageType';

const REQUEST_TYPE = ReplicatedMapMessageType.REPLICATEDMAP_PUTALL;
const RESPONSE_TYPE = 100;
const RETRYABLE = false;


export class ReplicatedMapPutAllCodec {


    static calculateSize(name: string, entries: any) {
// Calculates the request payload size
        let dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        entries.forEach((entriesItem: any) => {
            let key: Data = entriesItem[0];
            let val: Data = entriesItem[1];
            dataSize += BitsUtil.calculateSizeData(key);
            dataSize += BitsUtil.calculateSizeData(val);
        });
        return dataSize;
    }

    static encodeRequest(name: string, entries: any) {
// Encode request into clientMessage
        const clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, entries));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(entries.length);

        entries.forEach((entriesItem: any) => {
            let key: Data = entriesItem[0];
            let val: Data = entriesItem[1];
            clientMessage.appendData(key);
            clientMessage.appendData(val);
        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
