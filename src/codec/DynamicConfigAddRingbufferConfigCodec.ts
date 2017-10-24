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
import {DynamicConfigMessageType} from './DynamicConfigMessageType';

var REQUEST_TYPE = DynamicConfigMessageType.DYNAMICCONFIG_ADDRINGBUFFERCONFIG;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class DynamicConfigAddRingbufferConfigCodec {


    static calculateSize(name: string, capacity: number, backupCount: number, asyncBackupCount: number, timeToLiveSeconds: number, inMemoryFormat: string, ringbufferStoreConfig: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeString(inMemoryFormat);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (ringbufferStoreConfig !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.ringbufferstoreconfigholder(ringbufferStoreConfig);
        }
        return dataSize;
    }

    static encodeRequest(name: string, capacity: number, backupCount: number, asyncBackupCount: number, timeToLiveSeconds: number, inMemoryFormat: string, ringbufferStoreConfig: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, capacity, backupCount, asyncBackupCount, timeToLiveSeconds, inMemoryFormat, ringbufferStoreConfig));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(capacity);
        clientMessage.appendInt32(backupCount);
        clientMessage.appendInt32(asyncBackupCount);
        clientMessage.appendInt32(timeToLiveSeconds);
        clientMessage.appendString(inMemoryFormat);
        clientMessage.appendBoolean(ringbufferStoreConfig === null);
        if (ringbufferStoreConfig !== null) {
            RingbufferStoreConfigCodec.encode(clientMessage, ringbufferStoreConfig);
        }
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
