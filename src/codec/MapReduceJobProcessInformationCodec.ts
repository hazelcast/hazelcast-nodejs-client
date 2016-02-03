import {ClientMessage} from "../ClientMessage";
import {BitsUtil} from '../BitsUtil';
import {CustomCodec} from './CustomCodec';
import {MapReduceMessageType} from './MapReduceMessageType';

var REQUEST_TYPE = MapReduceMessageType.MAPREDUCE_JOBPROCESSINFORMATION
var RESPONSE_TYPE = 112
var RETRYABLE = true


export class MapReduceJobProcessInformationCodec{

constructor() {
}




static calculateSize(name, jobId){
    // Calculates the request payload size
    var dataSize = 0;
    dataSize += BitsUtil.calculateSizeStr(name);
    dataSize += BitsUtil.calculateSizeStr(jobId);
    return dataSize;
}

static encodeRequest(name, jobId){
    // Encode request into clientMessage
    var payloadSize;
    var clientMessage = new ClientMessage(payloadSize=this.calculateSize(name, jobId));
    clientMessage.setMessageType(REQUEST_TYPE);
    clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendStr(name);
    clientMessage.appendStr(jobId);
    clientMessage.updateFrameLength();
    return clientMessage;
}

static decodeResponse(clientMessage){
    // Decode response from client message
    var parameters;
    jobPartitionStatesSize = clientMessage.readInt();
    jobPartitionStates = [];
    for(var jobPartitionStatesIndex = 0 ;  jobPartitionStatesIndex <= jobPartitionStatesSize ; jobPartitionStatesIndex++){
    jobPartitionStatesItem = JobPartitionStateCodec.decode(clientMessage)
        jobPartitionStates.push(jobPartitionStatesItem)
    }
    parameters['jobPartitionStates'] = jobPartitionStates
    parameters['processRecords'] = clientMessage.readInt();
    return parameters;

}


}
