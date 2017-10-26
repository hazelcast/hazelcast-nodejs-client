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
import {ContinuousQueryMessageType} from './ContinuousQueryMessageType';

var REQUEST_TYPE = ContinuousQueryMessageType.CONTINUOUSQUERY_ADDLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class ContinuousQueryAddListenerCodec {


    static calculateSize(listenerName: string, localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(listenerName);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(listenerName: string, localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(listenerName, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(listenerName);
        clientMessage.appendBoolean(localOnly);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'response': null};
        parameters['response'] = clientMessage.readString();
        return parameters;

    }

    static handle(clientMessage: ClientMessage, handleEventQuerycachesingle: any, handleEventQuerycachebatch: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_QUERYCACHESINGLE && handleEventQuerycachesingle !== null) {
            var messageFinished = false;
            var data: any = undefined;
            if (!messageFinished) {
                data = QueryCacheEventDataCodec.decode(clientMessage, toObjectFunction);
            }
            handleEventQuerycachesingle(data);
        }
        if (messageType === BitsUtil.EVENT_QUERYCACHEBATCH && handleEventQuerycachebatch !== null) {
            var messageFinished = false;
            var events: any = undefined;
            if (!messageFinished) {

                var eventsSize = clientMessage.readInt32();
                events = [];
                for (var eventsIndex = 0; eventsIndex < eventsSize; eventsIndex++) {
                    var eventsItem: any;
                    eventsItem = QueryCacheEventDataCodec.decode(clientMessage, toObjectFunction);
                    events.push(eventsItem)
                }
            }
            var source: string = undefined;
            if (!messageFinished) {
                source = clientMessage.readString();
            }
            var partitionId: number = undefined;
            if (!messageFinished) {
                partitionId = clientMessage.readInt32();
            }
            handleEventQuerycachebatch(events, source, partitionId);
        }
    }

}
