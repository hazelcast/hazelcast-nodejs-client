/**
 * Represents a network address (e.g. of the client or a cluster member).
 */
export interface Address {
    /**
     * Host name or IP address.
     */
    host: string;
    /**
     * Port number.
     */
    port: number;
    /**
     * Returns string representation of the address.
     */
    toString(): string;
}
