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
import {ExecutorServiceMessageType} from './ExecutorServiceMessageType';

var REQUEST_TYPE = ExecutorServiceMessageType.EXECUTORSERVICE_CANCELONADDRESS;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class ExecutorServiceCancelOnAddressCodec {


    static calculateSize(uuid: string, address: Address, interrupt: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(uuid);
        dataSize += BitsUtil.calculateSizeAddress(address);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(uuid: string, address: Address, interrupt: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(uuid, address, interrupt));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(uuid);
        AddressCodec.encode(clientMessage, address);
        clientMessage.appendBoolean(interrupt);
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
