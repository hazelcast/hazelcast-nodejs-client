import * as Long from 'long';
/**
 * Represents UUIDs used by Hazelcast client. A UUID represents a 128-bit value.
 */
export declare class UUID {
    /**
     * Stands for the least significant 64 bits of the UUID.
     */
    readonly leastSignificant: Long;
    /**
     * Stands for the most significant 64 bits of the UUID.
     */
    readonly mostSignificant: Long;
    constructor(mostSig: Long, leastSig: Long);
    equals(other: UUID): boolean;
    static isUUID(obj: any): boolean;
    toString(): string;
}
