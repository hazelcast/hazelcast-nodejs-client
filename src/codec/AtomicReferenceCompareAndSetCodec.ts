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
import {AtomicReferenceMessageType} from './AtomicReferenceMessageType';

var REQUEST_TYPE = AtomicReferenceMessageType.ATOMICREFERENCE_COMPAREANDSET;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class AtomicReferenceCompareAndSetCodec {


    static calculateSize(name: string, expected: Data, updated: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (expected !== null) {
            dataSize += BitsUtil.calculateSizeData(expected);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (updated !== null) {
            dataSize += BitsUtil.calculateSizeData(updated);
        }
        return dataSize;
    }

    static encodeRequest(name: string, expected: Data, updated: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, expected, updated));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendBoolean(expected === null);
        if (expected !== null) {
            clientMessage.appendData(expected);
        }
        clientMessage.appendBoolean(updated === null);
        if (updated !== null) {
            clientMessage.appendData(updated);
        }
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
