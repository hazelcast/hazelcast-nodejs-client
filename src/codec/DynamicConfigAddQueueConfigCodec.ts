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

var REQUEST_TYPE = DynamicConfigMessageType.DYNAMICCONFIG_ADDQUEUECONFIG;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class DynamicConfigAddQueueConfigCodec {


    static calculateSize(name: string, listenerConfigs: any, backupCount: number, asyncBackupCount: number, maxSize: number, emptyQueueTtl: number, statisticsEnabled: boolean, quorumName: string, queueStoreConfig: any) {
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
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (quorumName !== null) {
            dataSize += BitsUtil.calculateSizeString(quorumName);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (queueStoreConfig !== null) {
            dataSize += BitsUtil.calculateSizeCom.hazelcast.client.impl.protocol.task.dynamicconfig.queuestoreconfigholder(queueStoreConfig);
        }
        return dataSize;
    }

    static encodeRequest(name: string, listenerConfigs: any, backupCount: number, asyncBackupCount: number, maxSize: number, emptyQueueTtl: number, statisticsEnabled: boolean, quorumName: string, queueStoreConfig: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, listenerConfigs, backupCount, asyncBackupCount, maxSize, emptyQueueTtl, statisticsEnabled, quorumName, queueStoreConfig));
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
        clientMessage.appendInt32(emptyQueueTtl);
        clientMessage.appendBoolean(statisticsEnabled);
        clientMessage.appendBoolean(quorumName === null);
        if (quorumName !== null) {
            clientMessage.appendString(quorumName);
        }
        clientMessage.appendBoolean(queueStoreConfig === null);
        if (queueStoreConfig !== null) {
            QueueStoreConfigCodec.encode(clientMessage, queueStoreConfig);
        }
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
