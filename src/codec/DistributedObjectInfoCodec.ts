/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {Utils} from './Utils';
import Address = require("../Address");

class DistributedObjectInfoCodec {
   static decode(clientMessage:ClientMessage):any {
       var serviceName = clientMessage.readString();
       var name = clientMessage.readString();
       return {key: serviceName, value: name};
   }
}

export = DistributedObjectInfoCodec
