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

var REQUEST_TYPE = DynamicConfigMessageType.DYNAMICCONFIG_ADDREPLICATEDMAPCONFIG;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class DynamicConfigAddReplicatedMapConfigCodec {


    static calculateSize(name: string, inMemoryFormat: string, asyncFillup: boolean, statisticsEnabled: boolean, mergePolicy: string, listenerConfigs: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.calculateSizeString(inMemoryFormat);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeString(mergePolicy);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (listenerConfigs !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            listenerConfigs.forEach((listenerConfigsItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.listenerconfigholder(listenerConfigsItem);
            });
        }
        return dataSize;
    }

    static encodeRequest(name: string, inMemoryFormat: string, asyncFillup: boolean, statisticsEnabled: boolean, mergePolicy: string, listenerConfigs: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, inMemoryFormat, asyncFillup, statisticsEnabled, mergePolicy, listenerConfigs));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendString(inMemoryFormat);
        clientMessage.appendBoolean(asyncFillup);
        clientMessage.appendBoolean(statisticsEnabled);
        clientMessage.appendString(mergePolicy);
        clientMessage.appendBoolean(listenerConfigs === null);
        if (listenerConfigs !== null) {
            clientMessage.appendInt32(listenerConfigs.length);

            listenerConfigs.forEach((listenerConfigsItem: any) => {
                ListenerConfigCodec.encode(clientMessage, listenerConfigsItem);
            });

        }
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
