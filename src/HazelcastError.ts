export class HazelcastError extends Error {
    constructor(msg: string) {
        super(msg);
        Error.captureStackTrace(this, HazelcastError);
        Object.setPrototypeOf(this, HazelcastError);
    }
}

export class AuthenticationError extends HazelcastError {
    constructor(msg: string) {
        super(msg);
        Object.setPrototypeOf(this, AuthenticationError);
    }
}

export class ClientNotActiveError extends HazelcastError {
    constructor(msg: string) {
        super(msg);
        Object.setPrototypeOf(this, ClientNotActiveError);
    }
}

export class IllegalStateError extends HazelcastError {
    constructor(msg: string) {
        super(msg);
        Object.setPrototypeOf(this, IllegalStateError);
    }
}

export class TopicOverloadError extends HazelcastError {
    constructor(msg: string) {
        super(msg);
        Object.setPrototypeOf(this, TopicOverloadError);
    }
}
