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
import {ListMessageType} from './ListMessageType';

var REQUEST_TYPE = ListMessageType.LIST_ADDALLWITHINDEX;
var RESPONSE_TYPE = 101;
var RETRYABLE = false;


export class ListAddAllWithIndexCodec {


    static calculateSize(name: string, index: number, valueList: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeString(name);
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        valueList.forEach((valueListItem: any) => {
            dataSize += BitsUtil.calculateSizeData(valueListItem);
        });
        return dataSize;
    }

    static encodeRequest(name: string, index: number, valueList: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(name, index, valueList));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendString(name);
        clientMessage.appendInt32(index);
        clientMessage.appendInt32(valueList.length);

        valueList.forEach((valueListItem: any) => {
            clientMessage.appendData(valueListItem);
        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'response': null
        };

        parameters['response'] = clientMessage.readBoolean();

        return parameters;
    }


}
