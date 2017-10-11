export class HazelcastError {

    message: string;
    stack: string;

    constructor(msg: string) {
        this.message = msg;
        Error.captureStackTrace(this, HazelcastError);
    }

    toString(): string {
        return this.message;
    }
}

export class AuthenticationError extends HazelcastError {
    constructor(msg: string) {
        super(msg);
    }
}

export class ClientNotActiveError extends HazelcastError {
    constructor(msg: string) {
        super(msg);
    }
}

export class IllegalStateError extends HazelcastError {
    constructor(msg: string) {
        super(msg);
    }
}

export class TopicOverloadError extends HazelcastError {
    constructor(msg: string) {
        super(msg);
    }
}
