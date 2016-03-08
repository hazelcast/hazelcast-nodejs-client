import ClientMessage = require('../ClientMessage');
import Address = require('../Address');

class GetPartitionsCodec {
    static encodeRequest(): ClientMessage {
        var clientMessage = ClientMessage.newClientMessage(0);
        clientMessage.setMessageType(0x0008);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): {[partitionId: number]: Address} {
        var result: {[partitionId: number]: Address} = {};
        var size = clientMessage.readInt32();

        for (var i = 0; i < size; i++) {
            var host = clientMessage.readString();
            var port = clientMessage.readInt32();
            var address = new Address(host, port);

            var partitionCount = clientMessage.readInt32();

            for (var j = 0; j < partitionCount; j++) {
                var partitionId = clientMessage.readInt32();
                result[partitionId] = address;
            }
        }

        return result;
    }
}

export = GetPartitionsCodec
