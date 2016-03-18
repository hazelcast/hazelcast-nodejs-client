/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import ImmutableLazyDataList = require('./ImmutableLazyDataList');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import {ClientMessageType} from './ClientMessageType';

var REQUEST_TYPE = ClientMessageType.CLIENT_GETPARTITIONS;
var RESPONSE_TYPE = 108;
var RETRYABLE = false;


export class ClientGetPartitionsCodec {


    static calculateSize() {
        // Calculates the request payload size
        var dataSize:number = 0;
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

    static decodeResponse(clientMessage:ClientMessage, toObjectFunction:(data:Data) => any = null) {
        // Decode response from client message
        var parameters:any = {'partitions': null};
        var partitionsSize = clientMessage.readInt32();
        var partitions:any = {};
        for (var partitionsIndex = 0; partitionsIndex < partitionsSize; partitionsIndex++) {
            var partitionsKey:any;
            partitionsKey = AddressCodec.decode(clientMessage);
            var partitionsValSize = clientMessage.readInt32();
            var partitionsVal:any = [];
            for (var partitionsValIndex = 0; partitionsValIndex < partitionsValSize; partitionsValIndex++) {
                var partitionsValItem:number;
                partitionsValItem = clientMessage.readInt32();
                partitionsVal.push(partitionsValItem)
            }
            partitions[partitionsKey] = partitionsVal;
            parameters['partitions'] = partitions;
        }
        return parameters;

    }


}
