/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {UUIDCodec} from './UUIDCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {CountDownLatchMessageType} from './CountDownLatchMessageType';

var REQUEST_TYPE = CountDownLatchMessageType.COUNTDOWNLATCH_AWAIT;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class CountDownLatchAwaitCodec {


    static calculateSize(name: string, timeout: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, timeout: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, timeout));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendLong(timeout);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };

        parameters['response'] = clientMessage.readBoolean();

        return parameters;
    }


}
