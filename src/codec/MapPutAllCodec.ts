/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_PUTALL;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class MapPutAllCodec {


    static calculateSize(name:string, entries:any) {
        // Calculates the request payload size
        var dataSize:number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        entries.foreach((entry:any) => {
            dataSize += BitsUtil.calculateSizeData(entry.key);
            dataSize += BitsUtil.calculateSizeData(entry.val);
        });
        return dataSize;
    }

    static encodeRequest(name:string, entries:any) {
        // Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, entries));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(entries.length);
        entries.foreach((entry:any) => {
            clientMessage.appendData(entry.key);
            clientMessage.appendData(entry.val);
        });
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
