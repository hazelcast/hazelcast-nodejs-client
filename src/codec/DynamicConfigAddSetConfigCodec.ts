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

var REQUEST_TYPE = DynamicConfigMessageType.DYNAMICCONFIG_ADDSETCONFIG;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class DynamicConfigAddSetConfigCodec {


    static calculateSize(name: string, listenerConfigs: any, backupCount: number, asyncBackupCount: number, maxSize: number, statisticsEnabled: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (listenerConfigs !== null) {
            dataSize += BitsUtil.INT_SIZE_IN_BYTES;

            listenerConfigs.forEach((listenerConfigsItem: any) => {
                dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.listenerconfigholder(listenerConfigsItem);
            });
        }
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(name: string, listenerConfigs: any, backupCount: number, asyncBackupCount: number, maxSize: number, statisticsEnabled: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, listenerConfigs, backupCount, asyncBackupCount, maxSize, statisticsEnabled));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendBoolean(listenerConfigs === null);
        if (listenerConfigs !== null) {
            clientMessage.appendInt32(listenerConfigs.length);

            listenerConfigs.forEach((listenerConfigsItem: any) => {
                ListenerConfigCodec.encode(clientMessage, listenerConfigsItem);
            });

        }
        clientMessage.appendInt32(backupCount);
        clientMessage.appendInt32(asyncBackupCount);
        clientMessage.appendInt32(maxSize);
        clientMessage.appendBoolean(statisticsEnabled);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
