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
import {ClientMessageType} from './ClientMessageType';

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
            var messageFinished = false;
            var partitionId: number = undefined;
            if (!messageFinished) {
                partitionId = clientMessage.readInt32();
            }
            var lostBackupCount: number = undefined;
            if (!messageFinished) {
                lostBackupCount = clientMessage.readInt32();
            }
            var source: Address = undefined;
            if (!messageFinished) {

                if (clientMessage.readBoolean() !== true) {
                    source = AddressCodec.decode(clientMessage, toObjectFunction);
                }
            }
            handleEventPartitionlost(partitionId, lostBackupCount, source);
        }
    }

}
