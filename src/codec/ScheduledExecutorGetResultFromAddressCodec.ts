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
import {ScheduledExecutorMessageType} from './ScheduledExecutorMessageType';

var REQUEST_TYPE = ScheduledExecutorMessageType.SCHEDULEDEXECUTOR_GETRESULTFROMADDRESS;
var RESPONSE_TYPE = 105;
var RETRYABLE = true;


export class ScheduledExecutorGetResultFromAddressCodec {


    static calculateSize(schedulerName: string, taskName: string, address: Address) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(schedulerName);
        dataSize += BitsUtil.calculateSizeString(taskName);
        dataSize += BitsUtil.calculateSizeAddress(address);
        return dataSize;
    }

    static encodeRequest(schedulerName: string, taskName: string, address: Address) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(schedulerName, taskName, address));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(schedulerName);
        clientMessage.appendString(taskName);
        AddressCodec.encode(clientMessage, address);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };

        if (clientMessage.isComplete()) {
            return parameters;
        }

        if (clientMessage.readBoolean() !== true) {
            parameters['response'] = toObjectFunction(clientMessage.readData());
        }

        return parameters;
    }


}
