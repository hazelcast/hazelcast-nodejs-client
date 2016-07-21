/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {AddressCodec} from './AddressCodec';
import {Data} from '../serialization/Data';
import {ClientMessageType} from './ClientMessageType';
import Address = require('../Address');
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');

var REQUEST_TYPE = ClientMessageType.CLIENT_GETPARTITIONS;
var RESPONSE_TYPE = 108;
var RETRYABLE = false;


export class ClientGetPartitionsCodec {


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

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'partitions': null};
        var partitionsSize = clientMessage.readInt32();
        var partitions: any = [];
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
        parameters['partitions'] = partitions;
        return parameters;

    }


}
