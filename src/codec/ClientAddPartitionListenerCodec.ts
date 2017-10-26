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

var REQUEST_TYPE = ClientMessageType.CLIENT_ADDPARTITIONLISTENER;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class ClientAddPartitionListenerCodec {


    static calculateSize() {
// Calculates the request payload size
        var dataSize: number = 0;
        return dataSize;
    }

    static encodeRequest() {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize());
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode

    static handle(clientMessage: ClientMessage, handleEventPartitions: any, toObjectFunction: (data: Data) => any = null) {

        var messageType = clientMessage.getMessageType();
        if (messageType === BitsUtil.EVENT_PARTITIONS && handleEventPartitions !== null) {
            var messageFinished = false;
            var partitions: any = undefined;
            if (!messageFinished) {
                messageFinished = clientMessage.isComplete();
            }
            if (!messageFinished) {

                var partitionsSize = clientMessage.readInt32();
                partitions = [];
                for (var partitionsIndex = 0; partitionsIndex < partitionsSize; partitionsIndex++) {
                    var partitionsItem: any;
                    var partitionsItemKey: Address;
                    var partitionsItemVal: any;
                    partitionsItemKey = AddressCodec.decode(clientMessage, toObjectFunction);

                    var partitionsItemValSize = clientMessage.readInt32();
                    var partitionsItemVal: any = [];
                    for (var partitionsItemValIndex = 0; partitionsItemValIndex < partitionsItemValSize; partitionsItemValIndex++) {
                        var partitionsItemValItem: number;
                        partitionsItemValItem = clientMessage.readInt32();
                        partitionsItemVal.push(partitionsItemValItem)
                    }
                    partitionsItem = [partitionsItemKey, partitionsItemVal];
                    partitions.push(partitionsItem)
                }
            }
            var partitionStateVersion: number = undefined;
            if (!messageFinished) {
                partitionStateVersion = clientMessage.readInt32();
            }
            handleEventPartitions(partitions, partitionStateVersion);
        }
    }

}
