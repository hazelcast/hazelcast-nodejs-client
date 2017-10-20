export class HazelcastError {

    message: string;
    cause: Error;
    stack: string;

    constructor(msg: string, cause?: Error) {
        this.message = msg;
        this.cause = cause;
        Error.captureStackTrace(this, HazelcastError);
    }

    toString(): string {
        return this.message;
    }
}

export class AuthenticationError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
    }
}

export class ClientNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
    }
}

export class IllegalStateError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
    }
}

export class TopicOverloadError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
    }
}
