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
import {TransactionalMapMessageType} from './TransactionalMapMessageType';

var REQUEST_TYPE = TransactionalMapMessageType.TRANSACTIONALMAP_CONTAINSKEY;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class TransactionalMapContainsKeyCodec {


    static calculateSize(name: string, txnId: string, threadId: any, key: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(txnId);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeData(key);
        return dataSize;
    }

    static encodeRequest(name: string, txnId: string, threadId: any, key: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, txnId, threadId, key));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(txnId);
        clientMessage.appendLong(threadId);
        clientMessage.appendData(key);
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
