import { Address } from './Address';
import { UUID } from './UUID';
/**
 * Local information of the client.
 */
export declare class ClientInfo {
    /**
     * The unique id of this client instance.
     */
    uuid: UUID;
    /**
     * Local port address that is used to communicate with a cluster.
     */
    localAddress: Address;
    /**
     * Type of this client. It is always `NodeJS`.
     */
    type: string;
    /**
     * Name of the client.
     */
    name: string;
    /**
     * Set of all labels of this client.
     */
    labels: Set<string>;
}
