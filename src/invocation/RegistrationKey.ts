import ClientMessage = require('../ClientMessage');
import {ListenerMessageCodec} from '../ListenerMessageCodec';

export class RegistrationKey {
    private readonly userRegistrationId: string;
    private registerHandlerFunc: Function;
    private registerRequest: ClientMessage;
    private codec: ListenerMessageCodec;

    constructor(regId: string, codec: ListenerMessageCodec, registerRequest?: ClientMessage, registerHandlerFunc?: Function) {
        this.userRegistrationId = regId;
        this.registerHandlerFunc = registerHandlerFunc;
        this.registerRequest = registerRequest;
        this.codec = codec;
    }

    getRegisterRequest(): ClientMessage {
        return this.registerRequest;
    }

    setRegisterRequest(registerRequest: ClientMessage): void {
        this.registerRequest = registerRequest;
    }

    getCodec(): ListenerMessageCodec {
        return this.codec;
    }

    setCodec(value: ListenerMessageCodec) {
        this.codec = value;
    }

    getHandler(): Function {
        return this.registerHandlerFunc;
    }

    setHandler(handler: Function): void {
        this.registerHandlerFunc = handler;
    }

    getUserRegistrationKey(): string {
        return this.userRegistrationId;
    }

}
