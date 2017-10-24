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

var REQUEST_TYPE = ContinuousQueryMessageType.CONTINUOUSQUERY_MADEPUBLISHABLE;
var RESPONSE_TYPE = 101;
var RETRYABLE = true;


export class ContinuousQueryMadePublishableCodec {


    static calculateSize(mapName: string, cacheName: string) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(mapName);
        dataSize += BitsUtil.calculateSizeString(cacheName);
        return dataSize;
    }

    static encodeRequest(mapName: string, cacheName: string) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(mapName, cacheName));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(mapName);
        clientMessage.appendString(cacheName);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'response': null};
        parameters['response'] = clientMessage.readBoolean();
        return parameters;

    }


}
