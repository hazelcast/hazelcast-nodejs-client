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
import {CacheMessageType} from './CacheMessageType';

var REQUEST_TYPE = CacheMessageType.CACHE_FETCHNEARCACHEINVALIDATIONMETADATA;
var RESPONSE_TYPE = 122;
var RETRYABLE = false;


export class CacheFetchNearCacheInvalidationMetadataCodec {


    static calculateSize(names: any, address: Address) {
// Calculates the request payload size
        var dataSize: number = 0;
        dataSize += BitsUtil.INT_SIZE_IN_BYTES;

        names.forEach((namesItem: any) => {
            dataSize += BitsUtil.calculateSizeString(namesItem);
        });
        dataSize += BitsUtil.calculateSizeAddress(address);
        return dataSize;
    }

    static encodeRequest(names: any, address: Address) {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize(names, address));
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.appendInt32(names.length);

        names.forEach((namesItem: any) => {
            clientMessage.appendString(namesItem);
        });

        AddressCodec.encode(clientMessage, address);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
        // Decode response from client message
        var parameters: any = {
            'namePartitionSequenceList': null,
            'partitionUuidList': null
        };

        if (clientMessage.isComplete()) {
            return parameters;
        }

        var namePartitionSequenceListSize = clientMessage.readInt32();
        var namePartitionSequenceList: any = [];
        for (var namePartitionSequenceListIndex = 0; namePartitionSequenceListIndex < namePartitionSequenceListSize; namePartitionSequenceListIndex++) {
            var namePartitionSequenceListItem: any;
            var namePartitionSequenceListItemKey: string;
            var namePartitionSequenceListItemVal: any;
            namePartitionSequenceListItemKey = clientMessage.readString();

            var namePartitionSequenceListItemValSize = clientMessage.readInt32();
            var namePartitionSequenceListItemVal: any = [];
            for (var namePartitionSequenceListItemValIndex = 0; namePartitionSequenceListItemValIndex < namePartitionSequenceListItemValSize; namePartitionSequenceListItemValIndex++) {
                var namePartitionSequenceListItemValItem: any;
                var namePartitionSequenceListItemValItemKey: number;
                var namePartitionSequenceListItemValItemVal: any;
                namePartitionSequenceListItemValItemKey = clientMessage.readInt32();
                namePartitionSequenceListItemValItemVal = clientMessage.readLong();
                namePartitionSequenceListItemValItem = [namePartitionSequenceListItemValItemKey, namePartitionSequenceListItemValItemVal];
                namePartitionSequenceListItemVal.push(namePartitionSequenceListItemValItem)
            }
            namePartitionSequenceListItem = [namePartitionSequenceListItemKey, namePartitionSequenceListItemVal];
            namePartitionSequenceList.push(namePartitionSequenceListItem)
        }
        parameters['namePartitionSequenceList'] = namePartitionSequenceList;


        var partitionUuidListSize = clientMessage.readInt32();
        var partitionUuidList: any = [];
        for (var partitionUuidListIndex = 0; partitionUuidListIndex < partitionUuidListSize; partitionUuidListIndex++) {
            var partitionUuidListItem: any;
            var partitionUuidListItemKey: number;
            var partitionUuidListItemVal: any;
            partitionUuidListItemKey = clientMessage.readInt32();
            partitionUuidListItemVal = UUIDCodec.decode(clientMessage, toObjectFunction);
            partitionUuidListItem = [partitionUuidListItemKey, partitionUuidListItemVal];
            partitionUuidList.push(partitionUuidListItem)
        }
        parameters['partitionUuidList'] = partitionUuidList;

        return parameters;
    }


}
