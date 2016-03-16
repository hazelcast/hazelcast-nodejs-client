/* tslint:disable */
import ClientMessage = require('../ClientMessage');
var REQUEST_TYPE = 0x000f;
var RESPONSE_TYPE = 100;
var RETRYABLE = true;


export class ClientPingCodec{
    static calculateSize(){
        return 0;
    }

    static encodeRequest() {

        var clientMessage = ClientMessage.newClientMessage(this.calculateSize());
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE)
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage) {
        return;
    }
}
