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
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_ADDENTRYLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class CacheAddEntryListenerCodec {


    static calculateSize(name: string, localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
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

    static handle(clientMessage: ClientMessage, handleEventCache: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_CACHE && handleEventCache !== null) {
            var messageFinished = false;
            var type: number = undefined;
            if (!messageFinished) {
                type = clientMessage.readInt32();
            }
            var keys: any = undefined;
            if (!messageFinished) {

                var keysSize = clientMessage.readInt32();
                keys = [];
                for (var keysIndex = 0; keysIndex < keysSize; keysIndex++) {
                    var keysItem: any;
                    keysItem = CacheEventDataCodec.decode(clientMessage, toObjectFunction);
                    keys.push(keysItem)
                }
            }
            var completionId: number = undefined;
            if (!messageFinished) {
                completionId = clientMessage.readInt32();
            }
            handleEventCache(type, keys, completionId);
        }
    }

}
