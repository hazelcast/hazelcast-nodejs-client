/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';
import {AddressCodec} from "./AddressCodec";

var REQUEST_TYPE = MapMessageType.MAP_CLEARNEARCACHE;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class MapClearNearCacheCodec {


    static calculateSize(name:string, target:Address) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeAddress(target);
        return dataSize;
    }

    static encodeRequest(name:string, target:Address) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, target));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        AddressCodec.encode(clientMessage, target);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
