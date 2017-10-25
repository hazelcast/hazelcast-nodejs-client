import ClientMessage = require('../ClientMessage');

export class RegistrationKey {
    private readonly userRegistrationId: string;
    private registerHandlerFunc: Function;
    private registerRequest: ClientMessage;
    private registerDecodeFunc: Function;

    constructor(regId: string, registerRequest?: ClientMessage, registerDecodeFunc?: Function, registerHandlerFunc?: Function) {
        this.userRegistrationId = regId;
        this.registerHandlerFunc = registerHandlerFunc;
        this.registerRequest = registerRequest;
        this.registerDecodeFunc = registerDecodeFunc;
    }

    getRegisterRequest(): ClientMessage {
        return this.registerRequest;
    }

    setRegisterRequest(registerRequest: ClientMessage): void {
        this.registerRequest = registerRequest;
    }

    getDecoder(): Function {
        return this.registerDecodeFunc;
    }

    setDecoder(decoder: Function): void {
        this.registerDecodeFunc = decoder;
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
