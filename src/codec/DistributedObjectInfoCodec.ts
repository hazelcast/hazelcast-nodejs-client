/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import Address = require("../Address");

class DistributedObjectInfoCodec {
    static decode(clientMessage: ClientMessage, toObjectFunction: Function): any {
        var serviceName = clientMessage.readString();
        var name = clientMessage.readString();
        return {key: serviceName, value: name};
    }
}

export = DistributedObjectInfoCodec
