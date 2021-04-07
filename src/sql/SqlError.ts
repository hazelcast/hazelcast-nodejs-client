/**
 * A server-side error that is propagated to the client.
 * @internal
 */
import {UUID} from '../core';

export class SqlError {
    constructor(
        readonly code: number,
        readonly message: string,
        readonly originatingMemberId: UUID
    ) {
    }
}
