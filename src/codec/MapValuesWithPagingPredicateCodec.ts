/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_VALUESWITHPAGINGPREDICATE;
var RESPONSE_TYPE = 117;
var RETRYABLE = false;


export class MapValuesWithPagingPredicateCodec{



static calculateSize(name : string  , predicate : Data ){
// Calculates the request payload size
var dataSize : number = 0;
            dataSize += BitsUtil.calculateSizeString(name);
            dataSize += BitsUtil.calculateSizeData(predicate);
return dataSize;
}

static encodeRequest(name : string, predicate : Data){
// Encode request into clientMessage
var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, predicate));
clientMessage.setMessageType(REQUEST_TYPE);
clientMessage.setRetryable(RETRYABLE);
    clientMessage.appendString(name);
    clientMessage.appendData(predicate);
clientMessage.updateFrameLength();
return clientMessage;
}

static decodeResponse(clientMessage : ClientMessage,  toObjectFunction: (data: Data) => any = null){
// Decode response from client message
var parameters :any = { 'response' : null  };
        var responseSize = clientMessage.readInt32();
            var response : any = [];
                    for(var responseIndex = 0 ;  responseIndex < responseSize ; responseIndex++){
        var responseItem : any;
        var responseItemKey: Data;
        var responseItemVal: any;
                    responseItemKey = clientMessage.readData();
                    responseItemVal = clientMessage.readData();
        responseItem = [responseItemKey, responseItemVal];
        response.push(responseItem)
        }
            parameters['response'] = response;
return parameters;

}


}
