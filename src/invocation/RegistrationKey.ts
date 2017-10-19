export class RegistrationKey {
    private readonly userRegistrationId: string;
    private handler: Function;
    private encoder: Function;
    private decoder: Function;

    constructor(regId: string, encoder?: Function, decoder?: Function, handler?: Function) {
        this.userRegistrationId = regId;
        this.handler = handler;
        this.encoder = encoder;
        this.decoder = decoder;
    }

    getEncoder(): Function {
        return this.encoder;
    }

    setEncoder(encoder: Function): void {
        this.encoder = encoder;
    }

    getDecoder(): Function {
        return this.decoder;
    }

    setDecoder(decoder: Function): void {
        this.decoder = decoder;
    }

    getHandler(): Function {
        return this.handler;
    }

    setHandler(handler: Function): void {
        this.handler = handler;
    }

    getUserRegistrationKey(): string {
        return this.userRegistrationId;
    }

}
