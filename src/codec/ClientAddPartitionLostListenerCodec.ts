/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import {AddressCodec} from './AddressCodec';
import {Data} from '../serialization/Data';
import {ClientMessageType} from './ClientMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = ClientMessageType.CLIENT_ADDPARTITIONLOSTLISTENER;
var RESPONSE_TYPE = 104;
var RETRYABLE = false;


export class ClientAddPartitionLostListenerCodec {


    static calculateSize(localOnly: boolean) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        return dataSize;
    }

    static encodeRequest(localOnly: boolean) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(localOnly));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
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

    static handle(clientMessage: ClientMessage, handleEventPartitionlost: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_PARTITIONLOST && handleEventPartitionlost !== null) {
            var partitionId: number;
            partitionId = clientMessage.readInt32();
            var lostBackupCount: number;
            lostBackupCount = clientMessage.readInt32();
            var source: Address;

            if (clientMessage.readBoolean() !== true) {
                source = AddressCodec.decode(clientMessage, toObjectFunction);
            }
            handleEventPartitionlost(partitionId, lostBackupCount, source);
        }
    }

}
