export class HazelcastError extends Error {

    cause: Error;
    stack: string;

    constructor(msg: string, cause?: Error) {
        super(msg);
        this.cause = cause;
        Error.captureStackTrace(this, HazelcastError);
        Object.setPrototypeOf(this, HazelcastError.prototype);
    }
}

export class AuthenticationError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class ClientNotActiveError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, ClientNotActiveError.prototype);
    }
}

export class IllegalStateError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, IllegalStateError.prototype);
    }
}

export class TopicOverloadError extends HazelcastError {
    constructor(msg: string, cause?: Error) {
        super(msg, cause);
        Object.setPrototypeOf(this, TopicOverloadError.prototype);
    }
}
