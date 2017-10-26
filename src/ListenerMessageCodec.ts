import ClientMessage = require('./ClientMessage');

export interface ListenerMessageCodec {
    encodeAddRequest: (localOnly: boolean) => ClientMessage;
    decodeAddResponse: (msg: ClientMessage) => string;
    encodeRemoveRequest: (listenerId: string) => ClientMessage;
    decodeRemoveResponse: (msg: ClientMessage) => boolean;
}
