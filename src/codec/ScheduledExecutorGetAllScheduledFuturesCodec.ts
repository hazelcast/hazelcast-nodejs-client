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

var REQUEST_TYPE = ScheduledExecutorMessageType.SCHEDULEDEXECUTOR_GETALLSCHEDULEDFUTURES;
var RESPONSE_TYPE = 121;
var RETRYABLE = true;


export class ScheduledExecutorGetAllScheduledFuturesCodec {


    static calculateSize(schedulerName: string) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(schedulerName);
        return dataSize;
    }

    static encodeRequest(schedulerName: string) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(schedulerName));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(schedulerName);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'handlers': null};

        var handlersSize = clientMessage.readInt32();
        var handlers: any = [];
        for (var handlersIndex = 0; handlersIndex < handlersSize; handlersIndex++) {
            var handlersItem: any;
            var handlersItemKey: any;
            var handlersItemVal: any;
            handlersItemKey = MemberCodec.decode(clientMessage, toObjectFunction);

            var handlersItemValSize = clientMessage.readInt32();
            var handlersItemVal: any = [];
            for (var handlersItemValIndex = 0; handlersItemValIndex < handlersItemValSize; handlersItemValIndex++) {
                var handlersItemValItem: any;
                handlersItemValItem = ScheduledTaskHandlerCodec.decode(clientMessage, toObjectFunction);
                handlersItemVal.push(handlersItemValItem)
            }
            handlersItem = [handlersItemKey, handlersItemVal];
            handlers.push(handlersItem)
        }
        parameters['handlers'] = handlers;
        return parameters;

    }


}
