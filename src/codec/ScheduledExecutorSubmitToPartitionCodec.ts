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

var REQUEST_TYPE = ScheduledExecutorMessageType.SCHEDULEDEXECUTOR_SUBMITTOPARTITION;
var RESPONSE_TYPE = 100;
var RETRYABLE = true;


export class ScheduledExecutorSubmitToPartitionCodec {


    static calculateSize(schedulerName: string, type: any, taskName: string, task: Data, initialDelayInMillis: any, periodInMillis: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(schedulerName);
        dataSize += BitsUtil.BYTE_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeString(taskName);
        dataSize += BitsUtil.calculateSizeData(task);
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        dataSize += BitsUtil.LONG_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(schedulerName: string, type: any, taskName: string, task: Data, initialDelayInMillis: any, periodInMillis: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(schedulerName, type, taskName, task, initialDelayInMillis, periodInMillis));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(schedulerName);
        clientMessage.appendByte(type);
        clientMessage.appendString(taskName);
        clientMessage.appendData(task);
        clientMessage.appendLong(initialDelayInMillis);
        clientMessage.appendLong(periodInMillis);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
