export class RegistrationKey {
    private readonly userRegistrationId: string;
    private registerHandlerFunc: Function;
    private registerEncodeFunc: Function;
    private registerDecodeFunc: Function;

    constructor(regId: string, registerEncodeFunc?: Function, registerDecodeFunc?: Function, registerHandlerFunc?: Function) {
        this.userRegistrationId = regId;
        this.registerHandlerFunc = registerHandlerFunc;
        this.registerEncodeFunc = registerEncodeFunc;
        this.registerDecodeFunc = registerDecodeFunc;
    }

    getEncoder(): Function {
        return this.registerEncodeFunc;
    }

    setEncoder(encoder: Function): void {
        this.registerEncodeFunc = encoder;
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
