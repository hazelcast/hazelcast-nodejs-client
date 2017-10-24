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

var REQUEST_TYPE = ClientMessageType.CLIENT_DEPLOYCLASSES;
var RESPONSE_TYPE = 100;
var RETRYABLE = false;


export class ClientDeployClassesCodec {


    static calculateSize(classDefinitions: any) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        classDefinitions.forEach((classDefinitionsItem: any) => {
            var key: string = classDefinitionsItem[0];
            var val: any = classDefinitionsItem[1];
            dataSize += BitsUtil.calculateSizeString(key);
            data_size += BitsUtil.INT_SIZE_IN_BYTES
            val.forEach((valItem: any) => {
                dataSize += BitsUtil.BYTE_SIZE_IN_BYTES;
            });
        });
        return dataSize;
    }

    static encodeRequest(classDefinitions: any) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(classDefinitions));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendInt32(classDefinitions.length);

        classDefinitions.forEach((classDefinitionsItem: any) => {
            var key: string = classDefinitionsItem[0];
            var val: any = classDefinitionsItem[1];
            clientMessage.appendString(key);
            clientMessage.appendInt32(val.length);

            val.forEach((valItem: any) => {
                clientMessage.appendByte(valItem);
            });

        });

        clientMessage.updateFrameLength();
        return clientMessage;
    }

// Empty decodeResponse(ClientMessage), this message has no parameters to decode


}
