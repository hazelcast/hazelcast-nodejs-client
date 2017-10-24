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

var REQUEST_TYPE = ScheduledExecutorMessageType.SCHEDULEDEXECUTOR_SHUTDOWN;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class ScheduledExecutorShutdownCodec {


    static calculateSize(schedulerName: string, address: Address) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(schedulerName);
        dataSize += BitsUtil.calculateSizeAddress(address);
        return dataSize;
    }

    static encodeRequest(schedulerName: string, address: Address) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(schedulerName, address));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(schedulerName);
        AddressCodec.encode(clientMessage, address);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
