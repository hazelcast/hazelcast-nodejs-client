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
import {TransactionalQueueMessageType} from './TransactionalQueueMessageType';

var REQUEST_TYPE = TransactionalQueueMessageType.TRANSACTIONALQUEUE_OFFER;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class TransactionalQueueOfferCodec {


    static calculateSize(name: string, txnId: string, threadId: any, item: Data, timeout: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(txnId);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeData(item);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, txnId: string, threadId: any, item: Data, timeout: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, txnId, threadId, item, timeout));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(txnId);
        clientMessage.appendLong(threadId);
        clientMessage.appendData(item);
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
