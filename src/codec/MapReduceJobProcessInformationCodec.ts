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
import {MapReduceMessageType} from './MapReduceMessageType';

var REQUEST_TYPE = MapReduceMessageType.MAPREDUCE_JOBPROCESSINFORMATION;
var RESPONSE_TYPE = 112;
var RETRYABLE = true;


export class MapReduceJobProcessInformationCodec {


    static calculateSize(name: string, jobId: string) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(jobId);
        return dataSize;
    }

    static encodeRequest(name: string, jobId: string) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, jobId));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(jobId);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'jobPartitionStates': null,
            'processRecords': null
        };


        var jobPartitionStatesSize = clientMessage.readInt32();
        var jobPartitionStates: any = [];
        for (var jobPartitionStatesIndex = 0; jobPartitionStatesIndex < jobPartitionStatesSize; jobPartitionStatesIndex++) {
            var jobPartitionStatesItem: any;
            jobPartitionStatesItem = JobPartitionStateCodec.decode(clientMessage, toObjectFunction);
            jobPartitionStates.push(jobPartitionStatesItem)
        }
        parameters['jobPartitionStates'] = jobPartitionStates;

        parameters['processRecords'] = clientMessage.readInt32();

        return parameters;
    }


}
