import { Address } from './Address';
import { UUID } from './UUID';
export interface Member {
    /**
     * Network address of member.
     */
    address: Address;
    /**
     * Unique id of the member in a cluster.
     */
    uuid: UUID;
    /**
     * Lite member flag.
     */
    liteMember: boolean;
    /**
     * Returns string representation of this member.
     */
    toString(): string;
}
