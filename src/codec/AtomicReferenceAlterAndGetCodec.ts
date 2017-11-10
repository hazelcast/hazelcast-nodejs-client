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

var REQUEST_TYPE = AtomicReferenceMessageType.ATOMICREFERENCE_ALTERANDGET;
var RESPONSE_TYPE = 105;
var RETRYABLE = false;


export class AtomicReferenceAlterAndGetCodec {


    static calculateSize(name: string, arr: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(arr);
        return dataSize;
    }

    static encodeRequest(name: string, arr: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, arr));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(arr);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };


        if (clientMessage.readBoolean() !== true) {
            parameters['response'] = toObjectFunction(clientMessage.readData());
        }

        return parameters;
    }


}
