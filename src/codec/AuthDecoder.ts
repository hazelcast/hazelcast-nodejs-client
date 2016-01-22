import ClientMessage = require("../ClientMessage");
import AuthResponse = require("../messages/auth/AuthResponse");
import Address = require("../Address");

class AuthDecoder {
    public static decode(clientMessage:ClientMessage):AuthResponse {
        var status = clientMessage.readUInt8();

        var address: Address = null;
        var isAddressNull = clientMessage.readBoolean();
        if (!isAddressNull) {
            var host = clientMessage.readString();
            var port = clientMessage.readInt32();
            address = new Address(host, port);
        }

        var uuid:string = null;
        var isUuidNull = clientMessage.readBoolean();
        if (!isUuidNull) {
            uuid = clientMessage.readString();
        }

        var ownerUuid:string = null;
        var isOwnerUuidNull = clientMessage.readBoolean();
        if (!isOwnerUuidNull) {
            ownerUuid = clientMessage.readString();
        }

        var serializationVersion = clientMessage.readUInt8();

        return new AuthResponse(status, address, uuid, ownerUuid, serializationVersion);
    }
}

export = AuthDecoder
