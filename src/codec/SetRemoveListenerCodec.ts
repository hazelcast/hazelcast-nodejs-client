/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {Data} from '../serialization/Data';
import {SetMessageType} from './SetMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = SetMessageType.SET_REMOVELISTENER;
var RESPONSE_TYPE = 101;
var RETRYABLE = true;


export class SetRemoveListenerCodec {


    static calculateSize(name: string, registrationId: string) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(registrationId);
        return dataSize;
    }

    static encodeRequest(name: string, registrationId: string) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, registrationId));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(registrationId);
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
