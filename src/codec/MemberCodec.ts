/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {Member} from '../core/Member';
import {AddressCodec} from './AddressCodec';

export class MemberCodec {

    static encode(clientMessage:ClientMessage, member: Member): void {
        AddressCodec.encode(clientMessage, member.address);
        clientMessage.appendString(member.uuid);
        clientMessage.appendBoolean(member.isLiteMember);
        var keys = Object.keys(member.attributes);
        clientMessage.appendInt32(keys.length);
        for (var key in keys) {
            clientMessage.appendString(key);
            clientMessage.appendString(member.attributes[key]);
        }
    }

    static decode(clientMessage: ClientMessage, toObject: Function) {
        var address: Address = AddressCodec.decode(clientMessage, toObject);
        var uuid = clientMessage.readString();
        var liteMember = clientMessage.readBoolean();
        var attributeSize = clientMessage.readInt32();
        var attributes: any = {};
        for (var i = 0; i<attributeSize; i++) {
            var key = clientMessage.readString();
            var val = clientMessage.readString();
            attributes[key] = val;
        }
        return new Member(address, uuid, liteMember, attributes);
    }
}
