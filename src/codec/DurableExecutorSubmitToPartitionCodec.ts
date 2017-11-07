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
import {DurableExecutorMessageType} from './DurableExecutorMessageType';

var REQUEST_TYPE = DurableExecutorMessageType.DURABLEEXECUTOR_SUBMITTOPARTITION;
var RESPONSE_TYPE = 102;
var RETRYABLE = true;


export class DurableExecutorSubmitToPartitionCodec {


    static calculateSize(name: string, callable: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(callable);
        return dataSize;
    }

    static encodeRequest(name: string, callable: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, callable));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(callable);
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
        parameters['response'] = clientMessage.readInt32();

        return parameters;
    }


}
