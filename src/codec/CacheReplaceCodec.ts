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

var REQUEST_TYPE = CacheMessageType.CACHE_REPLACE;
var RESPONSE_TYPE = 105;
var RETRYABLE = false;


export class CacheReplaceCodec {


    static calculateSize(name: string, key: Data, oldValue: Data, newValue: Data, expiryPolicy: Data, completionId: number) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeData(key);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (oldValue !== null) {
            dataSize += BitsUtil.calculateSizeData(oldValue);
        }
        dataSize += BitsUtil.calculateSizeData(newValue);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (expiryPolicy !== null) {
            dataSize += BitsUtil.calculateSizeData(expiryPolicy);
        }
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, key: Data, oldValue: Data, newValue: Data, expiryPolicy: Data, completionId: number) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, key, oldValue, newValue, expiryPolicy, completionId));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendData(key);
        clientMessage.appendBoolean(oldValue === null);
        if (oldValue !== null) {
            clientMessage.appendData(oldValue);
        }
        clientMessage.appendData(newValue);
        clientMessage.appendBoolean(expiryPolicy === null);
        if (expiryPolicy !== null) {
            clientMessage.appendData(expiryPolicy);
        }
        clientMessage.appendInt32(completionId);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'response': null};

        if (clientMessage.readBoolean() !== true) {
            parameters['response'] = toObjectFunction(clientMessage.readData());
        }
        return parameters;

    }


}
