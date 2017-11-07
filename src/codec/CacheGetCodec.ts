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

var REQUEST_TYPE = CacheMessageType.CACHE_GET;
var RESPONSE_TYPE = 105;
var RETRYABLE = true;


export class CacheGetCodec {


    static calculateSize(name: string, key: Data, expiryPolicy: Data) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (expiryPolicy !== null) {
            dataSize += BitsUtil.calculateSizeData(expiryPolicy);
        }
        return dataSize;
    }

    static encodeRequest(name: string, key: Data, expiryPolicy: Data) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, expiryPolicy));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.appendBoolean(expiryPolicy === null);
        if (expiryPolicy !== null) {
            clientMessage.appendData(expiryPolicy);
        }
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };


        if (clientMessage.readBoolean() !== true) {
            parameters['response'] = toObjectFunction(clientMessage.readData());
        }

        return parameters;
    }


}
