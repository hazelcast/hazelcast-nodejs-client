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

var REQUEST_TYPE = ClientMessageType.CLIENT_AUTHENTICATIONCUSTOM;
var RESPONSE_TYPE = 107;
var RETRYABLE = true;


export class ClientAuthenticationCustomCodec {


    static calculateSize(credentials: Data, uuid: string, ownerUuid: string, isOwnerConnection: boolean, clientType: string, serializationVersion: any, clientHazelcastVersion: string) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.calculateSizeData(credentials);
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (uuid !== null) {
            dataSize += BitsUtil.calculateSizeString(uuid);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        if (ownerUuid !== null) {
            dataSize += BitsUtil.calculateSizeString(ownerUuid);
        }
        dataSize += BitsUtil.BOOLEAN_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeString(clientType);
        dataSize += BitsUtil.BYTE_SIZE_IN_BYTES;
        dataSize += BitsUtil.calculateSizeString(clientHazelcastVersion);
        return dataSize;
    }

    static encodeRequest(credentials: Data, uuid: string, ownerUuid: string, isOwnerConnection: boolean, clientType: string, serializationVersion: any, clientHazelcastVersion: string) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(credentials, uuid, ownerUuid, isOwnerConnection, clientType, serializationVersion, clientHazelcastVersion));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendData(credentials);
        clientMessage.appendBoolean(uuid === null);
        if (uuid !== null) {
            clientMessage.appendString(uuid);
        }
        clientMessage.appendBoolean(ownerUuid === null);
        if (ownerUuid !== null) {
            clientMessage.appendString(ownerUuid);
        }
        clientMessage.appendBoolean(isOwnerConnection);
        clientMessage.appendString(clientType);
        clientMessage.appendByte(serializationVersion);
        clientMessage.appendString(clientHazelcastVersion);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'status': null,
            'address': null,
            'uuid': null,
            'ownerUuid': null,
            'serializationVersion': null,
            'serverHazelcastVersion': null,
            'clientUnregisteredMembers': null
        };

        parameters['status'] = clientMessage.readByte();


        if (clientMessage.readBoolean() !== true) {
            parameters['address'] = AddressCodec.decode(clientMessage, toObjectFunction);
        }


        if (clientMessage.readBoolean() !== true) {
            parameters['uuid'] = clientMessage.readString();
        }


        if (clientMessage.readBoolean() !== true) {
            parameters['ownerUuid'] = clientMessage.readString();
        }

        parameters['serializationVersion'] = clientMessage.readByte();

        if (clientMessage.isComplete()) {
            return parameters;
        }
        parameters['serverHazelcastVersion'] = clientMessage.readString();
        parameters.serverHazelcastVersionExist = true;

        if (clientMessage.readBoolean() !== true) {

            var clientUnregisteredMembersSize = clientMessage.readInt32();
            var clientUnregisteredMembers: any = [];
            for (var clientUnregisteredMembersIndex = 0; clientUnregisteredMembersIndex < clientUnregisteredMembersSize; clientUnregisteredMembersIndex++) {
                var clientUnregisteredMembersItem: any;
                clientUnregisteredMembersItem = MemberCodec.decode(clientMessage, toObjectFunction);
                clientUnregisteredMembers.push(clientUnregisteredMembersItem)
            }
            parameters['clientUnregisteredMembers'] = clientUnregisteredMembers;
        }
        parameters.clientUnregisteredMembersExist = true;
        return parameters;
    }


}
