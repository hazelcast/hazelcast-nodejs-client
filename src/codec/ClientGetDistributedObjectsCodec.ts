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
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_GETDISTRIBUTEDOBJECTS;
var RESPONSE_TYPE = 110;
var RETRYABLE = false;


export class ClientGetDistributedObjectsCodec {


    static calculateSize() {
// Calculates the request payload size
        var dataSize: number = 0;
        return dataSize;
    }

    static encodeRequest() {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize());
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };


        var responseSize = clientMessage.readInt32();
        var response: any = [];
        for (var responseIndex = 0; responseIndex < responseSize; responseIndex++) {
            var responseItem: any;
            responseItem = DistributedObjectInfoCodec.decode(clientMessage, toObjectFunction);
            response.push(responseItem)
        }
        parameters['response'] = response;

        return parameters;
    }


}
